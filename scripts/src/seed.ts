import {
  db,
  usersTable,
  teamsTable,
  teamMembersTable,
  namespacesTable,
  starterKitsTable,
  deploymentsTable,
  evidenceTable,
  operatorsTable,
} from "@workspace/db";

async function seed() {
  console.log("Seeding database...");

  // Seed users
  const [adminUser] = await db.insert(usersTable).values({
    githubId: "demo-admin-001",
    username: "demo-admin",
    displayName: "Alex Platform Admin",
    avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
    email: "admin@demo.platform.io",
    role: "admin",
  }).onConflictDoUpdate({
    target: usersTable.githubId,
    set: { displayName: "Alex Platform Admin" },
  }).returning();

  const [user1] = await db.insert(usersTable).values({
    githubId: "demo-user-002",
    username: "sarah-dev",
    displayName: "Sarah Developer",
    avatarUrl: "https://avatars.githubusercontent.com/u/2?v=4",
    email: "sarah@demo.platform.io",
    role: "member",
  }).onConflictDoUpdate({
    target: usersTable.githubId,
    set: { displayName: "Sarah Developer" },
  }).returning();

  const [user2] = await db.insert(usersTable).values({
    githubId: "demo-user-003",
    username: "marcus-eng",
    displayName: "Marcus Engineer",
    avatarUrl: "https://avatars.githubusercontent.com/u/3?v=4",
    email: "marcus@demo.platform.io",
    role: "member",
  }).onConflictDoUpdate({
    target: usersTable.githubId,
    set: { displayName: "Marcus Engineer" },
  }).returning();

  // Seed teams
  const [team1] = await db.insert(teamsTable).values({
    name: "Payments",
    slug: "payments",
    description: "Payments processing and billing services",
    createdBy: adminUser.id,
  }).onConflictDoUpdate({ target: teamsTable.slug, set: { name: "Payments" } }).returning();

  const [team2] = await db.insert(teamsTable).values({
    name: "Identity",
    slug: "identity",
    description: "Authentication, authorization, and identity management",
    createdBy: adminUser.id,
  }).onConflictDoUpdate({ target: teamsTable.slug, set: { name: "Identity" } }).returning();

  const [team3] = await db.insert(teamsTable).values({
    name: "Data Platform",
    slug: "data-platform",
    description: "Data ingestion, processing and analytics infrastructure",
    createdBy: adminUser.id,
  }).onConflictDoUpdate({ target: teamsTable.slug, set: { name: "Data Platform" } }).returning();

  // Seed team members
  for (const team of [team1, team2, team3]) {
    await db.insert(teamMembersTable).values({ teamId: team.id, userId: adminUser.id, role: "owner" }).onConflictDoNothing();
  }
  await db.insert(teamMembersTable).values({ teamId: team1.id, userId: user1.id, role: "member" }).onConflictDoNothing();
  await db.insert(teamMembersTable).values({ teamId: team2.id, userId: user2.id, role: "member" }).onConflictDoNothing();
  await db.insert(teamMembersTable).values({ teamId: team3.id, userId: user1.id, role: "owner" }).onConflictDoNothing();
  await db.insert(teamMembersTable).values({ teamId: team3.id, userId: user2.id, role: "member" }).onConflictDoNothing();

  // Seed namespaces
  const [ns1] = await db.insert(namespacesTable).values({
    teamId: team1.id,
    environment: "dev",
    k8sNamespace: "payments-dev",
    status: "active",
    cpuLimit: "4",
    memoryLimit: "8Gi",
    podLimit: 20,
  }).onConflictDoUpdate({ target: namespacesTable.k8sNamespace, set: { status: "active" } }).returning();

  const [ns2] = await db.insert(namespacesTable).values({
    teamId: team1.id,
    environment: "prod",
    k8sNamespace: "payments-prod",
    status: "active",
    cpuLimit: "8",
    memoryLimit: "16Gi",
    podLimit: 50,
  }).onConflictDoUpdate({ target: namespacesTable.k8sNamespace, set: { status: "active" } }).returning();

  const [ns3] = await db.insert(namespacesTable).values({
    teamId: team2.id,
    environment: "dev",
    k8sNamespace: "identity-dev",
    status: "active",
    cpuLimit: "4",
    memoryLimit: "8Gi",
    podLimit: 20,
  }).onConflictDoUpdate({ target: namespacesTable.k8sNamespace, set: { status: "active" } }).returning();

  const [ns4] = await db.insert(namespacesTable).values({
    teamId: team2.id,
    environment: "prod",
    k8sNamespace: "identity-prod",
    status: "active",
    cpuLimit: "8",
    memoryLimit: "16Gi",
    podLimit: 50,
  }).onConflictDoUpdate({ target: namespacesTable.k8sNamespace, set: { status: "active" } }).returning();

  const [ns5] = await db.insert(namespacesTable).values({
    teamId: team3.id,
    environment: "dev",
    k8sNamespace: "data-platform-dev",
    status: "active",
    cpuLimit: "4",
    memoryLimit: "8Gi",
    podLimit: 20,
  }).onConflictDoUpdate({ target: namespacesTable.k8sNamespace, set: { status: "active" } }).returning();

  // Seed starter kits
  await db.insert(starterKitsTable).values([
    {
      name: "Node.js REST API",
      description: "Production-ready Express.js REST API with OpenAPI spec, Zod validation, Jest tests, and CI/CD pipeline.",
      category: "api",
      language: "TypeScript",
      framework: "Express.js",
      tags: ["rest", "openapi", "postgresql", "docker"],
      dockerfileIncluded: true,
      cicdIncluded: true,
      complianceReady: true,
    },
    {
      name: "React SPA",
      description: "React + Vite single page application with Tanstack Query, authentication hooks, and Storybook.",
      category: "web",
      language: "TypeScript",
      framework: "React + Vite",
      tags: ["react", "vite", "tailwind", "storybook"],
      dockerfileIncluded: true,
      cicdIncluded: true,
      complianceReady: true,
    },
    {
      name: "Python ML Service",
      description: "FastAPI service for serving ML models. Includes model versioning, A/B testing support, and Prometheus metrics.",
      category: "ml",
      language: "Python",
      framework: "FastAPI",
      tags: ["python", "ml", "prometheus", "kubernetes"],
      dockerfileIncluded: true,
      cicdIncluded: true,
      complianceReady: true,
    },
    {
      name: "Go Microservice",
      description: "Minimal Go microservice with gRPC, Protobuf definitions, health checks, and distributed tracing.",
      category: "api",
      language: "Go",
      framework: "net/http + gRPC",
      tags: ["go", "grpc", "tracing", "k8s"],
      dockerfileIncluded: true,
      cicdIncluded: true,
      complianceReady: true,
    },
    {
      name: "Kafka Worker",
      description: "Event-driven worker that consumes from Kafka topics. Includes dead-letter queue, retry logic, and observability.",
      category: "worker",
      language: "TypeScript",
      framework: "Node.js",
      tags: ["kafka", "worker", "events", "dlq"],
      dockerfileIncluded: true,
      cicdIncluded: true,
      complianceReady: false,
    },
    {
      name: "Data Pipeline",
      description: "Apache Spark batch processing pipeline with dbt transformations. Outputs to S3 + Snowflake.",
      category: "data",
      language: "Python",
      framework: "PySpark + dbt",
      tags: ["spark", "dbt", "s3", "snowflake"],
      dockerfileIncluded: true,
      cicdIncluded: false,
      complianceReady: false,
    },
  ]).onConflictDoNothing();

  // Seed operators
  await db.insert(operatorsTable).values([
    {
      name: "AWS S3 Operator",
      description: "Provision and manage S3 buckets directly from your namespace. Supports lifecycle policies, versioning, and CORS.",
      type: "s3",
      status: "active",
      version: "v2.4.1",
    },
    {
      name: "AWS RDS Operator",
      description: "Provision PostgreSQL, MySQL, or Aurora databases with automated backups, failover, and parameter groups.",
      type: "rds",
      status: "active",
      version: "v1.9.0",
    },
    {
      name: "Salesforce Operator",
      description: "Sync data and trigger workflows in Salesforce. Supports CRM objects, custom metadata, and Platform Events.",
      type: "salesforce",
      status: "active",
      version: "v0.8.2",
    },
    {
      name: "Kafka Operator",
      description: "Provision Kafka topics, manage consumer groups, and configure ACLs directly from Kubernetes.",
      type: "kafka",
      status: "active",
      version: "v3.1.0",
    },
    {
      name: "Redis Operator",
      description: "Provision Redis instances and Redis Cluster. Supports Sentinel mode, TLS, and automatic failover.",
      type: "redis",
      status: "active",
      version: "v1.2.4",
    },
    {
      name: "HashiCorp Vault Operator",
      description: "Inject secrets from Vault into pods. Supports dynamic secrets, PKI, and automatic secret rotation.",
      type: "vault",
      status: "active",
      version: "v0.5.1",
    },
  ]).onConflictDoNothing();

  // Seed deployments with evidence
  const deploymentSeeds = [
    { ns: ns1, service: "payment-gateway", tag: "v1.8.3", coverage: 92, triggeredBy: user1.id },
    { ns: ns2, service: "payment-gateway", tag: "v1.7.0", coverage: 85, triggeredBy: adminUser.id },
    { ns: ns2, service: "payment-gateway", tag: "v1.8.0", coverage: 72, triggeredBy: user1.id },
    { ns: ns3, service: "auth-service", tag: "v2.1.1", coverage: 45, triggeredBy: user2.id },
    { ns: ns4, service: "auth-service", tag: "v2.0.9", coverage: 91, triggeredBy: adminUser.id },
    { ns: ns5, service: "pipeline-runner", tag: "v0.3.2", coverage: 30, triggeredBy: user1.id },
  ];

  for (const seed of deploymentSeeds) {
    const isProd = seed.ns.environment === "prod";
    const compliancePassed = isProd ? seed.coverage >= 80 : true;

    const [dep] = await db.insert(deploymentsTable).values({
      teamId: seed.ns.teamId,
      namespaceId: seed.ns.id,
      serviceName: seed.service,
      imageTag: seed.tag,
      status: compliancePassed ? "succeeded" : "blocked",
      complianceStatus: compliancePassed ? "passed" : "failed",
      testCoverage: seed.coverage,
      triggeredBy: seed.triggeredBy,
    }).returning();

    // Evidence records
    if (isProd) {
      await db.insert(evidenceTable).values({
        deploymentId: dep.id,
        teamId: seed.ns.teamId,
        checkType: "test_coverage",
        status: compliancePassed ? "passed" : "failed",
        details: compliancePassed
          ? `Test coverage ${seed.coverage}% meets prod requirement of 80%`
          : `Test coverage ${seed.coverage}% is below prod requirement of 80%. Deployment blocked.`,
        threshold: 80,
        actual: seed.coverage,
      });
    } else {
      await db.insert(evidenceTable).values({
        deploymentId: dep.id,
        teamId: seed.ns.teamId,
        checkType: "test_coverage",
        status: "skipped",
        details: `Test coverage check not required for dev environment`,
        threshold: null,
        actual: seed.coverage,
      });
    }

    await db.insert(evidenceTable).values([
      {
        deploymentId: dep.id,
        teamId: seed.ns.teamId,
        checkType: "security_scan",
        status: "passed",
        details: `Security scan passed for image ${seed.tag}. No critical CVEs detected.`,
        threshold: null,
        actual: null,
      },
      {
        deploymentId: dep.id,
        teamId: seed.ns.teamId,
        checkType: "policy_gate",
        status: "passed",
        details: `OPA policy gate passed. Service ${seed.service} is permitted to deploy to ${seed.ns.environment}.`,
        threshold: null,
        actual: null,
      },
      {
        deploymentId: dep.id,
        teamId: seed.ns.teamId,
        checkType: "rbac_check",
        status: "passed",
        details: `RBAC check passed. Team has write access to namespace ${seed.ns.k8sNamespace}.`,
        threshold: null,
        actual: null,
      },
    ]);
  }

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
