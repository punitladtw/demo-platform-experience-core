import { Router, type IRouter } from "express";
import { db, namespacesTable, teamsTable, teamMembersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListNamespacesResponse,
  GetNamespaceResponse,
  CreateNamespaceBody,
  GetNamespaceParams,
  DeleteNamespaceParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

async function buildNamespaceResponse(ns: any) {
  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, ns.teamId));
  return {
    ...ns,
    teamName: team?.name ?? "Unknown",
    teamSlug: team?.slug ?? "unknown",
    resourceQuota: {
      cpuLimit: ns.cpuLimit,
      memoryLimit: ns.memoryLimit,
      podLimit: ns.podLimit,
    },
  };
}

router.get("/namespaces", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  let namespaces;

  if (user.role === "admin") {
    namespaces = await db.select().from(namespacesTable).orderBy(namespacesTable.createdAt);
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

    namespaces = await db.select().from(namespacesTable).orderBy(namespacesTable.createdAt);
    namespaces = namespaces.filter((n) => teamIds.includes(n.teamId));
  }

  const result = await Promise.all(namespaces.map(buildNamespaceResponse));
  res.json(ListNamespacesResponse.parse(result));
});

router.post("/namespaces", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateNamespaceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, parsed.data.teamId));
  if (!team) {
    res.status(400).json({ error: "Team not found" });
    return;
  }

  const k8sNamespace = `${team.slug}-${parsed.data.environment}`;

  const [ns] = await db.insert(namespacesTable).values({
    teamId: parsed.data.teamId,
    environment: parsed.data.environment,
    k8sNamespace,
    status: "active",
    cpuLimit: parsed.data.environment === "prod" ? "8" : "4",
    memoryLimit: parsed.data.environment === "prod" ? "16Gi" : "8Gi",
    podLimit: parsed.data.environment === "prod" ? 50 : 20,
  }).returning();

  const result = await buildNamespaceResponse(ns);
  res.status(201).json(GetNamespaceResponse.parse(result));
});

router.get("/namespaces/:namespaceId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.namespaceId) ? req.params.namespaceId[0] : req.params.namespaceId;
  const params = GetNamespaceParams.safeParse({ namespaceId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ns] = await db.select().from(namespacesTable).where(eq(namespacesTable.id, params.data.namespaceId));
  if (!ns) {
    res.status(404).json({ error: "Namespace not found" });
    return;
  }

  const result = await buildNamespaceResponse(ns);
  res.json(GetNamespaceResponse.parse(result));
});

router.delete("/namespaces/:namespaceId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.namespaceId) ? req.params.namespaceId[0] : req.params.namespaceId;
  const params = DeleteNamespaceParams.safeParse({ namespaceId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [ns] = await db.delete(namespacesTable).where(eq(namespacesTable.id, params.data.namespaceId)).returning();
  if (!ns) {
    res.status(404).json({ error: "Namespace not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
