import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const app: Express = express();

app.set("trust proxy", 1);

// Vercel's catch-all sometimes forwards `/healthz` instead of `/api/healthz`.
if (process.env.VERCEL) {
  app.use((req, _res, next) => {
    const url = req.url || "/";
    if (url === "/api" || url.startsWith("/api/") || url.startsWith("/api?")) {
      next();
      return;
    }
    const q = url.indexOf("?");
    const path = q === -1 ? url : url.slice(0, q);
    const query = q === -1 ? "" : url.slice(q);
    const normalized = path.startsWith("/") ? path : `/${path}`;
    req.url = `/api${normalized}${query}`;
    next();
  });
}

const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET?.trim();
const weakSessionSecrets = new Set([
  "",
  "portfolio-secret-key",
  "change-me-to-a-long-random-string",
]);
if (!sessionSecret || weakSessionSecrets.has(sessionSecret)) {
  throw new Error(
    "SESSION_SECRET must be set to a strong random value (see .env.example). Never commit real secrets.",
  );
}

function withScheme(host: string): string {
  if (host.startsWith("http://") || host.startsWith("https://")) return host;
  return `https://${host}`;
}

// Comma-separated allowlist for split frontend/backend deploys (e.g. Vercel + Render).
// On Vercel the platform sets VERCEL_URL, so same-origin previews work without a manual CORS_ORIGIN.
const configuredOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
const vercelOrigins = [
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_URL,
]
  .map((host) => host?.trim())
  .filter((host): host is string => Boolean(host))
  .map(withScheme);
const corsOrigins = Array.from(new Set([...configuredOrigins, ...vercelOrigins]));

if (isProduction && corsOrigins.length === 0) {
  throw new Error(
    "CORS_ORIGIN must be set in production (e.g. https://your-app.vercel.app)",
  );
}

const crossOrigin = corsOrigins.length > 0;
const PgSession = connectPgSimple(session);

// SameSite=None requires Secure. Allow Secure on http://localhost / 127.0.0.1
// (browsers treat them as secure contexts) so split local origins still work.
const cookieSecure = isProduction || crossOrigin;
const cookieSameSite = crossOrigin ? ("none" as const) : ("lax" as const);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: crossOrigin
      ? (origin, callback) => {
          // Allow non-browser tools (no Origin) and allowlisted frontends
          if (!origin || corsOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
          }
        }
      : true,
    credentials: true,
  }),
);

// JSON payloads are small; file uploads use multer separately
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

let sessionTableReady: Promise<void> | undefined;
function ensureSessionTable(): Promise<void> {
  if (!sessionTableReady) {
    sessionTableReady = pool
      .query(
        `CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL,
          PRIMARY KEY ("sid")
        );
        CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");`,
      )
      .then(() => undefined)
      .catch((err: unknown) => {
        sessionTableReady = undefined;
        throw err;
      });
  }
  return sessionTableReady;
}

app.use((req, res, next) => {
  ensureSessionTable().then(() => next(), next);
});

app.use(
  session({
    store: new PgSession({
      pool,
      createTableIfMissing: false,
      tableName: "session",
    }),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: cookieSecure,
      httpOnly: true,
      // Cross-site cookies require SameSite=None + Secure (Vercel → Render)
      sameSite: cookieSameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

app.use("/api", router);

export default app;
