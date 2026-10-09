import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";
import { agentLog } from "./lib/debug-agent-log";

const app: Express = express();

app.set("trust proxy", 1);

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

// Comma-separated allowlist for split frontend/backend deploys (e.g. Vercel + Render).
const corsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

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

// #region agent log
agentLog("A,B", "app.ts:session-cookie-config", "Session cookie + CORS config at boot", {
  secure: cookieSecure,
  sameSite: cookieSameSite,
  crossOrigin,
  corsOrigins,
  isProduction,
  nodeEnv: process.env.NODE_ENV ?? null,
  runId: "post-fix",
});
// #endregion

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

app.use(
  session({
    store: new PgSession({
      pool,
      createTableIfMissing: true,
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
