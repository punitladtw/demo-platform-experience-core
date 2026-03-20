import { Router, type IRouter } from "express";
import { db, deploymentsTable, namespacesTable, teamsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  ListDeploymentsResponse,
  GetDeploymentResponse,
  CreateDeploymentBody,
  GetDeploymentParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { runComplianceChecks } from "../lib/compliance";

const router: IRouter = Router();

async function buildDeploymentResponse(dep: any) {
  const [ns] = await db.select().from(namespacesTable).where(eq(namespacesTable.id, dep.namespaceId));
  const [team] = await db.select().from(teamsTable).where(eq(teamsTable.id, dep.teamId));
  const [triggeredByUser] = await db.select().from(usersTable).where(eq(usersTable.id, dep.triggeredBy));

  return {
    ...dep,
    teamName: team?.name ?? "Unknown",
    namespaceName: ns?.k8sNamespace ?? "unknown",
    environment: ns?.environment ?? "dev",
    triggeredByUsername: triggeredByUser?.username ?? "unknown",
  };
}

router.get("/deployments", requireAuth, async (req, res): Promise<void> => {
  const user = (req as any).user;
  let deployments;

  if (user.role === "admin") {
    deployments = await db.select().from(deploymentsTable).orderBy(deploymentsTable.createdAt);
  } else {
    deployments = await db.select().from(deploymentsTable)
      .where(eq(deploymentsTable.triggeredBy, user.id))
      .orderBy(deploymentsTable.createdAt);
  }

  const result = await Promise.all(deployments.map(buildDeploymentResponse));
  res.json(ListDeploymentsResponse.parse(result));
});

router.post("/deployments", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateDeploymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const user = (req as any).user;
  const [ns] = await db.select().from(namespacesTable).where(eq(namespacesTable.id, parsed.data.namespaceId));
  if (!ns) {
    res.status(400).json({ error: "Namespace not found" });
    return;
  }

  const [dep] = await db.insert(deploymentsTable).values({
    teamId: ns.teamId,
    namespaceId: parsed.data.namespaceId,
    serviceName: parsed.data.serviceName,
    imageTag: parsed.data.imageTag,
    status: "pending",
    complianceStatus: "pending",
    testCoverage: parsed.data.testCoverage ?? null,
    triggeredBy: user.id,
  }).returning();

  const compliance = await runComplianceChecks({
    deploymentId: dep.id,
    teamId: ns.teamId,
    environment: ns.environment,
    serviceName: dep.serviceName,
    imageTag: dep.imageTag,
    testCoverage: dep.testCoverage,
  });

  const finalStatus = compliance.passed ? "succeeded" : "blocked";
  const complianceStatus = compliance.passed ? "passed" : "failed";

  const [updated] = await db.update(deploymentsTable)
    .set({ status: finalStatus, complianceStatus })
    .where(eq(deploymentsTable.id, dep.id))
    .returning();

  const result = await buildDeploymentResponse(updated);
  res.status(201).json(GetDeploymentResponse.parse(result));
});

router.get("/deployments/:deploymentId", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.deploymentId) ? req.params.deploymentId[0] : req.params.deploymentId;
  const params = GetDeploymentParams.safeParse({ deploymentId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [dep] = await db.select().from(deploymentsTable).where(eq(deploymentsTable.id, params.data.deploymentId));
  if (!dep) {
    res.status(404).json({ error: "Deployment not found" });
    return;
  }

  const result = await buildDeploymentResponse(dep);
  res.json(GetDeploymentResponse.parse(result));
});

export default router;
