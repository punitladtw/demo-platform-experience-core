import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetMeResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

const DEMO_USERS = [
  {
    githubId: "demo-admin-001",
    username: "alex-admin",
    displayName: "Alex Platform Admin",
    avatarUrl: "https://avatars.githubusercontent.com/u/583231?v=4",
    email: "alex@platform.demo",
    role: "admin" as const,
  },
  {
    githubId: "demo-dev-002",
    username: "sam-dev",
    displayName: "Sam Developer",
    avatarUrl: "https://avatars.githubusercontent.com/u/1024025?v=4",
    email: "sam@platform.demo",
    role: "member" as const,
  },
];

router.post("/auth/login", async (req, res): Promise<void> => {
  const { persona = "admin" } = req.body as { persona?: string };
  const demo = persona === "admin" ? DEMO_USERS[0] : DEMO_USERS[1];

  const [user] = await db
    .insert(usersTable)
    .values(demo)
    .onConflictDoUpdate({
      target: usersTable.githubId,
      set: { displayName: demo.displayName, avatarUrl: demo.avatarUrl },
    })
    .returning();

  req.session.userId = user.id;
  res.json({ ok: true, user });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {});
  res.json({ message: "Logged out" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  res.json(
    GetMeResponse.parse({
      id: user.id,
      githubId: user.githubId,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }),
  );
});

export default router;
