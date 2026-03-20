import { Router, type IRouter } from "express";
import { db, evidenceTable, deploymentsTable, teamsTable, namespacesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { ListEvidenceResponse, GetEvidenceResponse, GetEvidenceParams, ListEvidenceQueryParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function buildEvidenceResponse(ev: any) {
  const [dep] = await db.select().from(deploymentsTable).where(eq(deploymentsTable.id, ev.deploymentId));
  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, ev.teamId));
  const [ns] = dep ? await db.select().from(namespacesTable).where(eq(namespacesTable.id, dep.namespaceId)) : [null];

  return {
    ...ev,
    teamName: team?.name ?? "Unknown",
    environment: (ns?.environment ?? "dev") as "dev" | "prod",
    serviceName: dep?.serviceName ?? "unknown",
    imageTag: dep?.imageTag ?? "unknown",
  };
}

router.get("/evidence", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  const query = ListEvidenceQueryParams.safeParse(req.query);

  let evidence = await db.select().from(evidenceTable).orderBy(evidenceTable.createdAt);

  if (user.role !== "admin") {
    const { teamMembersTable } = await import("@workspace/db");
    const memberTeams = await db
      .select({ teamId: teamMembersTable.teamId })
      .from(teamMembersTable)
      .where(eq(teamMembersTable.userId, user.id));
    const teamIds = memberTeams.map((m) => m.teamId);
    evidence = evidence.filter((e) => teamIds.includes(e.teamId));
  }

  if (query.success && query.data.teamId) {
    evidence = evidence.filter((e) => e.teamId === query.data.teamId);
  }
  if (query.success && query.data.deploymentId) {
    evidence = evidence.filter((e) => e.deploymentId === query.data.deploymentId);
  }
  if (query.success && query.data.status) {
    evidence = evidence.filter((e) => e.status === query.data.status);
  }

  const result = await Promise.all(evidence.map(buildEvidenceResponse));
  res.json(ListEvidenceResponse.parse(result));
});

router.get("/evidence/:evidenceId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.evidenceId) ? req.params.evidenceId[0] : req.params.evidenceId;
  const params = GetEvidenceParams.safeParse({ evidenceId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ev] = await db.select().from(evidenceTable).where(eq(evidenceTable.id, params.data.evidenceId));
  if (!ev) {
    res.status(404).json({ error: "Evidence record not found" });
    return;
  }

  const result = await buildEvidenceResponse(ev);
  res.json(GetEvidenceResponse.parse(result));
});

export default router;
