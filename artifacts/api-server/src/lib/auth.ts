import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import { logger } from "./logger";

export interface AuthUser {
  id: number;
  githubId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  email: string | null;
  role: string;
}

declare module "express-session" {
  interface SessionData {
    userId?: number;
    oauthState?: string;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.session?.userId) {
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Unauthenticated" });
    return;
  }

  (req as any).user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user as AuthUser;
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden: admin access required" });
    return;
  }
  next();
}

export function getUser(req: Request): AuthUser | null {
  return (req as any).user ?? null;
}
