import { Router, type IRouter, type Request, type Response } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, siteSettingsTable } from "@workspace/db";
import { loginRateLimiter } from "../middlewares/loginRateLimit";

const router: IRouter = Router();

router.post("/admin/login", loginRateLimiter, async (req: Request, res: Response) => {
  const { password } = req.body as { password?: string };
  if (!password || typeof password !== "string") {
    res.status(400).json({ error: "Password required" });
    return;
  }

  try {
    const settings = await db.select().from(siteSettingsTable).limit(1);
    const row = settings[0];

    const envPassword = process.env["ADMIN_PASSWORD"];
    let match = false;

    if (row?.adminPasswordHash) {
      // Prefer the stored hash so Settings password changes stick.
      // ADMIN_PASSWORD only bootstraps when no hash exists yet.
      match = await bcrypt.compare(password, row.adminPasswordHash);
    } else if (envPassword && password === envPassword) {
      match = true;
      const newHash = await bcrypt.hash(password, 10);
      if (row) {
        await db
          .update(siteSettingsTable)
          .set({ adminPasswordHash: newHash })
          .where(eq(siteSettingsTable.id, row.id));
      } else {
        await db.insert(siteSettingsTable).values({ adminPasswordHash: newHash });
      }
    }

    if (!match) {
      res.status(401).json({
        error: row?.adminPasswordHash ? "Invalid password" : "Admin not configured",
      });
      return;
    }

    (req.session as unknown as Record<string, unknown>)["isAdmin"] = true;
    res.json({ authenticated: true });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/admin/logout", (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ authenticated: false });
  });
});

router.get("/admin/me", (req: Request, res: Response) => {
  const isAdmin = (req.session as unknown as Record<string, unknown>)["isAdmin"] === true;
  res.json({ authenticated: isAdmin });
});

export default router;
