import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import Table from "cli-table3";
import { apiRequest } from "../lib/api.js";

interface EvidenceRecord {
  id: number;
  deploymentId: number;
  teamId: number;
  teamName: string;
  environment: string;
  serviceName: string;
  imageTag: string;
  checkType: string;
  status: string;
  details: string;
  threshold?: number;
  actual?: number;
  createdAt: string;
}

function statusBadge(status: string): string {
  switch (status) {
    case "passed": return chalk.green("✓ passed");
    case "failed": return chalk.red("✗ failed");
    case "skipped": return chalk.gray("– skipped");
    default: return chalk.gray(status);
  }
}

function checkTypeLabel(type: string): string {
  switch (type) {
    case "test_coverage": return "Test Coverage";
    case "security_scan": return "Security Scan";
    case "policy_gate": return "Policy Gate";
    case "rbac_check": return "RBAC Check";
    default: return type;
  }
}

export const evidenceCmd = new Command("evidence").description("Compliance evidence vault");

evidenceCmd
  .command("list")
  .description("List evidence records")
  .option("--team <teamId>", "Filter by team ID")
  .option("--deployment <deploymentId>", "Filter by deployment ID")
  .option("--status <status>", "Filter by status (passed|failed|skipped)")
  .action(async (opts: { team?: string; deployment?: string; status?: string }) => {
    const spinner = ora("Fetching evidence vault...").start();
    try {
      const params = new URLSearchParams();
      if (opts.team) params.set("teamId", opts.team);
      if (opts.deployment) params.set("deploymentId", opts.deployment);
      if (opts.status) params.set("status", opts.status);

      const query = params.toString() ? `?${params.toString()}` : "";
      const records = await apiRequest<EvidenceRecord[]>(`/evidence${query}`);
      spinner.stop();

      console.log();
      console.log(chalk.bold.blue("  Compliance Evidence Vault"));
      console.log();

      if (records.length === 0) {
        console.log(chalk.gray("  No evidence records found."));
        return;
      }

      const passed = records.filter((r) => r.status === "passed").length;
      const failed = records.filter((r) => r.status === "failed").length;
      const skipped = records.filter((r) => r.status === "skipped").length;

      console.log(
        `  Summary: ${chalk.green(`${passed} passed`)}  ${chalk.red(`${failed} failed`)}  ${chalk.gray(`${skipped} skipped`)}`
      );
      console.log();

      const table = new Table({
        head: [
          chalk.bold("ID"),
          chalk.bold("Deploy"),
          chalk.bold("Team"),
          chalk.bold("Env"),
          chalk.bold("Service"),
          chalk.bold("Check"),
          chalk.bold("Status"),
          chalk.bold("Threshold"),
          chalk.bold("Actual"),
        ],
        style: { head: [], border: [] },
      });

      for (const rec of records) {
        const envColor = rec.environment === "prod" ? chalk.red : chalk.green;
        table.push([
          rec.id,
          rec.deploymentId,
          chalk.cyan(rec.teamName),
          envColor(rec.environment),
          rec.serviceName,
          checkTypeLabel(rec.checkType),
          statusBadge(rec.status),
          rec.threshold != null ? `${rec.threshold}%` : "—",
          rec.actual != null ? `${rec.actual}%` : "—",
        ]);
      }

      console.log(table.toString());
      console.log();

      const failed_details = records.filter((r) => r.status === "failed");
      if (failed_details.length > 0) {
        console.log(chalk.red.bold("  Failures:"));
        for (const f of failed_details) {
          console.log(chalk.red(`    • [Deploy #${f.deploymentId}] ${checkTypeLabel(f.checkType)}: ${f.details}`));
        }
        console.log();
      }
    } catch (err: any) {
      spinner.fail(chalk.red(`Error: ${err.message}`));
    }
  });
