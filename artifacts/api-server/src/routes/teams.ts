import { Router, type IRouter } from "express";
import { db, teamsTable, teamMembersTable, usersTable, namespacesTable } from "@workspace/db";
import { eq, count, and } from "drizzle-orm";
import {
  ListTeamsResponse,
  GetTeamResponse,
  CreateTeamBody,
  UpdateTeamBody,
  GetTeamParams,
  UpdateTeamParams,
  DeleteTeamParams,
  ListTeamMembersParams,
  AddTeamMemberBody,
  AddTeamMemberParams,
  RemoveTeamMemberParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function buildTeamResponse(team: any) {
  const [{ count: memberCount }] = await db
    .select({ count: count() })
    .from(teamMembersTable)
    .where(eq(teamMembersTable.teamId, team.id));

  const [{ count: namespaceCount }] = await db
    .select({ count: count() })
    .from(namespacesTable)
    .where(eq(namespacesTable.teamId, team.id));

  return {
    ...team,
    memberCount: Number(memberCount),
    namespaceCount: Number(namespaceCount),
  };
}

router.get("/teams", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  let teams;

  if (user.role === "admin") {
    teams = await db.select().from(teamsTable).orderBy(teamsTable.createdAt);
  } else {
    const memberTeams = await db
      .select({ teamId: teamMembersTable.teamId })
      .from(teamMembersTable)
      .where(eq(teamMembersTable.userId, user.id));
    const teamIds = memberTeams.map((m) => m.teamId);

    if (teamIds.length === 0) {
      res.json([]);
      return;
    }

    teams = await db.select().from(teamsTable).orderBy(teamsTable.createdAt);
    teams = teams.filter((t) => teamIds.includes(t.id));
  }

  const result = await Promise.all(teams.map(buildTeamResponse));
  res.json(ListTeamsResponse.parse(result));
});

router.post("/teams", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = (req as any).user;
  const [team] = await db.insert(teamsTable).values({
    name: parsed.data.name,
    slug: parsed.data.slug,
    description: parsed.data.description ?? null,
    createdBy: user.id,
  }).returning();

  await db.insert(teamMembersTable).values({ teamId: team.id, userId: user.id, role: "owner" });

  const result = await buildTeamResponse(team);
  res.status(201).json(GetTeamResponse.parse(result));
});

router.get("/teams/:teamId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
  const params = GetTeamParams.safeParse({ teamId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, params.data.teamId));
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  const result = await buildTeamResponse(team);
  res.json(GetTeamResponse.parse(result));
});

router.patch("/teams/:teamId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
  const params = UpdateTeamParams.safeParse({ teamId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTeamBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [team] = await db.update(teamsTable)
    .set({ ...parsed.data })
    .where(eq(teamsTable.id, params.data.teamId))
    .returning();

  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  const result = await buildTeamResponse(team);
  res.json(GetTeamResponse.parse(result));
});

router.delete("/teams/:teamId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
  const params = DeleteTeamParams.safeParse({ teamId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [team] = await db.delete(teamsTable).where(eq(teamsTable.id, params.data.teamId)).returning();
  if (!team) {
    res.status(404).json({ error: "Team not found" });
    return;
  }

  res.sendStatus(204);
});

router.get("/teams/:teamId/members", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
  const params = ListTeamMembersParams.safeParse({ teamId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const members = await db.select({
    id: teamMembersTable.id,
    teamId: teamMembersTable.teamId,
    userId: teamMembersTable.userId,
    role: teamMembersTable.role,
    joinedAt: teamMembersTable.joinedAt,
    user: {
      id: usersTable.id,
      githubId: usersTable.githubId,
      username: usersTable.username,
      displayName: usersTable.displayName,
      avatarUrl: usersTable.avatarUrl,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    },
  })
    .from(teamMembersTable)
    .innerJoin(usersTable, eq(teamMembersTable.userId, usersTable.id))
    .where(eq(teamMembersTable.teamId, params.data.teamId));

  res.json(members);
});

router.post("/teams/:teamId/members", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
  const params = AddTeamMemberParams.safeParse({ teamId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = AddTeamMemberBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [member] = await db.insert(teamMembersTable).values({
    teamId: params.data.teamId,
    userId: parsed.data.userId,
    role: parsed.data.role ?? "member",
  }).returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, member.userId));
  res.status(201).json({ ...member, user });
});

router.delete("/teams/:teamId/members/:userId", requireAuth, async (req, res): Promise<void> => {
  const teamRaw = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
  const userRaw = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
  const params = RemoveTeamMemberParams.safeParse({
    teamId: parseInt(teamRaw, 10),
    userId: parseInt(userRaw, 10),
  });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [member] = await db.delete(teamMembersTable)
    .where(and(
      eq(teamMembersTable.teamId, params.data.teamId),
      eq(teamMembersTable.userId, params.data.userId)
    ))
    .returning();

  if (!member) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
