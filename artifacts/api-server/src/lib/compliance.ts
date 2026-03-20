import { db, evidenceTable, deploymentsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export const TEST_COVERAGE_THRESHOLD_PROD = 80;
export const TEST_COVERAGE_THRESHOLD_DEV = 0;

interface ComplianceInput {
  deploymentId: number;
  teamId: number;
  environment: string;
  serviceName: string;
  imageTag: string;
  testCoverage?: number | null;
}

interface ComplianceResult {
  passed: boolean;
  checks: Array<{
    checkType: string;
    status: "passed" | "failed" | "skipped";
    details: string;
    threshold?: number | null;
    actual?: number | null;
  }>;
}

export async function runComplianceChecks(input: ComplianceInput): Promise<ComplianceResult> {
  const { deploymentId, teamId, environment, serviceName, imageTag, testCoverage } = input;
  const isProd = environment === "prod";
  const checks: ComplianceResult["checks"] = [];

  // Test Coverage Check
  if (isProd) {
    const threshold = TEST_COVERAGE_THRESHOLD_PROD;
    const coverage = testCoverage ?? 0;
    const passed = coverage >= threshold;
    checks.push({
      checkType: "test_coverage",
      status: passed ? "passed" : "failed",
      details: passed
        ? `Test coverage ${coverage}% meets the production requirement of ${threshold}%`
        : `Test coverage ${coverage}% is below the production requirement of ${threshold}%. Deployment blocked.`,
      threshold,
      actual: coverage,
    });
  } else {
    checks.push({
      checkType: "test_coverage",
      status: "skipped",
      details: `Test coverage check is not required for ${environment} environment`,
      threshold: null,
      actual: testCoverage ?? null,
    });
  }

  // Security Scan Check (mocked)
  checks.push({
    checkType: "security_scan",
    status: "passed",
    details: `Security scan passed for image ${imageTag}. No critical CVEs detected.`,
    threshold: null,
    actual: null,
  });

  // Policy Gate Check (mocked RBAC / OPA)
  checks.push({
    checkType: "policy_gate",
    status: "passed",
    details: `OPA policy gate passed. Service ${serviceName} is permitted to deploy to ${environment}.`,
    threshold: null,
    actual: null,
  });

  // RBAC Check (mocked Kubernetes RBAC)
  checks.push({
    checkType: "rbac_check",
    status: "passed",
    details: `RBAC check passed. Team has write access to namespace for ${environment}.`,
    threshold: null,
    actual: null,
  });

  const allPassed = checks.every((c) => c.status === "passed" || c.status === "skipped");

  // Write evidence records
  for (const check of checks) {
    await db.insert(evidenceTable).values({
      deploymentId,
      teamId,
      checkType: check.checkType,
      status: check.status,
      details: check.details,
      threshold: check.threshold ?? null,
      actual: check.actual ?? null,
    });
  }

  return { passed: allPassed, checks };
}
