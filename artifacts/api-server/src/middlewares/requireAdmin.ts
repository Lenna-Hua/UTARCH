import type { Request, Response, NextFunction } from "express";

type SessionShape = { isAdmin?: boolean; userId?: number };

function sessionOf(req: Request): SessionShape {
  return req.session as unknown as SessionShape;
}

export function isAdminSession(req: Request): boolean {
  return sessionOf(req).isAdmin === true || typeof sessionOf(req).userId === "number";
}

export function sessionUserId(req: Request): number | null {
  const id = sessionOf(req).userId;
  return typeof id === "number" ? id : null;
}

export function setStaffSession(req: Request, userId: number): void {
  const session = sessionOf(req);
  session.isAdmin = true;
  session.userId = userId;
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!isAdminSession(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

/** Studio tools require a personal staff account, not the legacy shared password. */
export function requireStaff(req: Request, res: Response, next: NextFunction): void {
  if (sessionUserId(req) === null) {
    res.status(401).json({ error: "Sign in with your staff account" });
    return;
  }
  next();
}
