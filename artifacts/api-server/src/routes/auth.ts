import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetMeResponse } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID ?? "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET ?? "";

function getBaseUrl(): string {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  const domains = process.env.REPLIT_DOMAINS;
  if (domains) {
    const first = domains.split(",")[0].trim();
    return `https://${first}`;
  }
  return "http://localhost:80";
}

router.get("/auth/github", (req, res): void => {
  if (!GITHUB_CLIENT_ID) {
    res.redirect("/api/auth/github/callback?demo=1");
    return;
  }

  const state = Math.random().toString(36).substring(7);
  req.session.oauthState = state;

  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: `${getBaseUrl()}/api/auth/github/callback`,
    scope: "user:email read:org",
    state,
  });

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

router.get("/auth/github/callback", async (req, res): Promise<void> => {
  const { code, state, demo } = req.query as { code?: string; state?: string; demo?: string };

  if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET || demo === "1") {
    req.log.warn("GitHub OAuth not configured — using demo login");
    const [existingAdmin] = await db.select().from(usersTable).where(eq(usersTable.role, "admin"));
    let userId: number;
    if (existingAdmin) {
      userId = existingAdmin.id;
    } else {
      const demoUser = {
        githubId: "demo-admin-001",
        username: "demo-admin",
        displayName: "Demo Admin",
        avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
        email: "admin@demo.platform.io",
        role: "admin",
      };
      const [u] = await db.insert(usersTable).values(demoUser).onConflictDoUpdate({
        target: usersTable.githubId,
        set: { displayName: demoUser.displayName },
      }).returning();
      userId = u.id;
    }
    req.session.userId = userId;
    res.redirect("/");
    return;
  }

  if (!code) {
    res.redirect("/?error=no_code");
    return;
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id: GITHUB_CLIENT_ID, client_secret: GITHUB_CLIENT_SECRET, code, redirect_uri: `${getBaseUrl()}/api/auth/github/callback` }),
    });
    const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };

    if (!tokenData.access_token) {
      req.log.error({ tokenData }, "Failed to get access token");
      res.redirect("/?error=token_failed");
      return;
    }

    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, "User-Agent": "platform-engineering-portal" },
    });
    const ghUser = (await userRes.json()) as {
      id: number; login: string; name?: string; avatar_url?: string; email?: string;
    };

    const existingUsers = await db.select().from(usersTable);
    const isFirstUser = existingUsers.length === 0;

    const [user] = await db.insert(usersTable).values({
      githubId: String(ghUser.id),
      username: ghUser.login,
      displayName: ghUser.name ?? ghUser.login,
      avatarUrl: ghUser.avatar_url ?? null,
      email: ghUser.email ?? null,
      role: isFirstUser ? "admin" : "member",
    }).onConflictDoUpdate({
      target: usersTable.githubId,
      set: {
        username: ghUser.login,
        displayName: ghUser.name ?? ghUser.login,
        avatarUrl: ghUser.avatar_url ?? null,
      },
    }).returning();

    req.session.userId = user.id;
    res.redirect("/");
  } catch (err) {
    req.log.error({ err }, "GitHub OAuth error");
    res.redirect("/?error=oauth_failed");
  }
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {});
  res.json({ message: "Logged out" });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  res.json(GetMeResponse.parse({
    id: user.id,
    githubId: user.githubId,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }));
});

export default router;
