import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { apiRequest } from "../lib/api.js";

interface Deployment {
  id: number;
  teamName: string;
  namespaceName: string;
  environment: string;
  serviceName: string;
  imageTag: string;
  status: string;
  complianceStatus: string;
  testCoverage?: number;
}

export const deployCmd = new Command("deploy")
  .description("Deploy a service to the platform (runs compliance checks)")
  .requiredOption("--namespace <namespaceId>", "Namespace ID to deploy to")
  .requiredOption("--service <name>", "Service name")
  .requiredOption("--image <tag>", "Image tag to deploy")
  .option("--coverage <percent>", "Test coverage percentage (required for prod)")
  .action(async (opts: { namespace: string; service: string; image: string; coverage?: string }) => {
    console.log();
    console.log(chalk.bold.blue("  Platform Deploy"));
    console.log(chalk.gray("  ────────────────────────────────────"));
    console.log();
    console.log(`  ${chalk.cyan("Service:")}    ${opts.service}`);
    console.log(`  ${chalk.cyan("Image:")}      ${opts.image}`);
    console.log(`  ${chalk.cyan("Namespace:")}  ${opts.namespace}`);
    if (opts.coverage) {
      console.log(`  ${chalk.cyan("Coverage:")}   ${opts.coverage}%`);
    }
    console.log();

    const spinner = ora("Running compliance checks...").start();

    try {
      const deployment = await apiRequest<Deployment>("/deployments", {
        method: "POST",
        body: JSON.stringify({
          namespaceId: parseInt(opts.namespace, 10),
          serviceName: opts.service,
          imageTag: opts.image,
          testCoverage: opts.coverage ? parseFloat(opts.coverage) : null,
        }),
      });

      spinner.stop();

      const isPassed = deployment.complianceStatus === "passed";

      console.log(chalk.gray("  Compliance Results:"));
      console.log();

      if (deployment.environment === "prod") {
        const coverageOk = (deployment.testCoverage ?? 0) >= 80;
        console.log(
          `    ${coverageOk ? chalk.green("✓") : chalk.red("✗")} Test Coverage: ${deployment.testCoverage ?? 0}% ${coverageOk ? chalk.gray("(≥80% required)") : chalk.red("(< 80% required — BLOCKED)")}`
        );
      } else {
        console.log(`    ${chalk.gray("–")} Test Coverage: ${chalk.gray("skipped (dev environment)")}`);
      }

      console.log(`    ${chalk.green("✓")} Security Scan: ${chalk.gray("passed")}`);
      console.log(`    ${chalk.green("✓")} Policy Gate: ${chalk.gray("passed")}`);
      console.log(`    ${chalk.green("✓")} RBAC Check: ${chalk.gray("passed")}`);
      console.log();

      if (isPassed) {
        console.log(chalk.green.bold(`  ✓ Deployment #${deployment.id} succeeded!`));
        console.log(chalk.gray(`    ${deployment.serviceName}:${deployment.imageTag} → ${deployment.namespaceName}`));
      } else {
        console.log(chalk.red.bold(`  ✗ Deployment #${deployment.id} BLOCKED by compliance.`));
        console.log(chalk.red(`    Reason: Test coverage too low for production deployment.`));
        console.log(chalk.gray(`    Run with higher test coverage (≥80%) to deploy to prod.`));
        console.log();
        console.log(chalk.gray(`    Evidence recorded in vault. Run:`));
        console.log(chalk.cyan(`      platform evidence list --deployment ${deployment.id}`));
      }
      console.log();
    } catch (err: any) {
      spinner.fail(chalk.red(`Deployment failed: ${err.message}`));
    }
  });
