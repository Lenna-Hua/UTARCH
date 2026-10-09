import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, staffUsersTable } from "@workspace/db";
import { loginRateLimiter } from "../middlewares/loginRateLimit";
import { sessionUserId, setStaffSession } from "../middlewares/requireAdmin";

const router: IRouter = Router();

function publicUser(row: { id: number; name: string; email: string }) {
  return { id: row.id, name: row.name, email: row.email };
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

router.post("/auth/register", loginRateLimiter, async (req: Request, res: Response) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";

  if (name.length < 2) {
    res.status(400).json({ error: "Name must be at least 2 characters" });
    return;
  }
  if (!email) {
    res.status(400).json({ error: "A valid email is required" });
    return;
  }
  if (password.length < 12) {
    res.status(400).json({ error: "Password must be at least 12 characters" });
    return;
  }

  try {
    const existing = await db
      .select({ id: staffUsersTable.id })
      .from(staffUsersTable)
      .where(eq(staffUsersTable.email, email))
      .limit(1);
    if (existing[0]) {
      res.status(409).json({ error: "An account with that email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const inserted = await db
      .insert(staffUsersTable)
      .values({ name, email, passwordHash })
      .returning({
        id: staffUsersTable.id,
        name: staffUsersTable.name,
        email: staffUsersTable.email,
      });
    const user = inserted[0]!;
    setStaffSession(req, user.id);
    res.status(201).json({ authenticated: true, user: publicUser(user) });
  } catch (err) {
    req.log.error({ err }, "Register error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/login", loginRateLimiter, async (req: Request, res: Response) => {
  const email = normalizeEmail(req.body?.email);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(staffUsersTable)
      .where(eq(staffUsersTable.email, email))
      .limit(1);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    setStaffSession(req, user.id);
    res.json({ authenticated: true, user: publicUser(user) });
  } catch (err) {
    req.log.error({ err }, "Staff login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ authenticated: false, user: null });
  });
});

router.get("/auth/me", async (req: Request, res: Response) => {
  const userId = sessionUserId(req);
  if (userId === null) {
    res.json({ authenticated: false, user: null });
    return;
  }
  try {
    const rows = await db
      .select({
        id: staffUsersTable.id,
        name: staffUsersTable.name,
        email: staffUsersTable.email,
      })
      .from(staffUsersTable)
      .where(eq(staffUsersTable.id, userId))
      .limit(1);
    const user = rows[0];
    if (!user) {
      res.json({ authenticated: false, user: null });
      return;
    }
    res.json({ authenticated: true, user: publicUser(user) });
  } catch (err) {
    req.log.error({ err }, "Auth me error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
