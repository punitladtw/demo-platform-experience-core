import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import Table from "cli-table3";
import { apiRequest } from "../lib/api.js";

interface Namespace {
  id: number;
  teamId: number;
  teamName: string;
  teamSlug: string;
  environment: string;
  k8sNamespace: string;
  status: string;
  resourceQuota: { cpuLimit: string; memoryLimit: string; podLimit: number };
  createdAt: string;
}

interface Team { id: number; name: string; slug: string; }

export const namespacesCmd = new Command("namespaces").description("Manage Kubernetes namespaces");

namespacesCmd
  .command("list")
  .description("List all namespaces")
  .option("--team <slug>", "Filter by team slug")
  .action(async (opts: { team?: string }) => {
    const spinner = ora("Fetching namespaces...").start();
    try {
      let namespaces = await apiRequest<Namespace[]>("/namespaces");
      if (opts.team) {
        namespaces = namespaces.filter((n) => n.teamSlug === opts.team);
      }
      spinner.stop();
      console.log();
      console.log(chalk.bold.blue("  Kubernetes Namespaces"));
      console.log();

      if (namespaces.length === 0) {
        console.log(chalk.gray("  No namespaces found."));
        return;
      }

      const table = new Table({
        head: [
          chalk.bold("ID"),
          chalk.bold("Team"),
          chalk.bold("K8s Namespace"),
          chalk.bold("Env"),
          chalk.bold("Status"),
          chalk.bold("CPU"),
          chalk.bold("Memory"),
          chalk.bold("Pods"),
        ],
        style: { head: [], border: [] },
      });

      for (const ns of namespaces) {
        const envColor = ns.environment === "prod" ? chalk.red : chalk.green;
        const statusColor = ns.status === "active" ? chalk.green : chalk.yellow;
        table.push([
          ns.id,
          chalk.cyan(ns.teamName),
          chalk.bold(ns.k8sNamespace),
          envColor(ns.environment),
          statusColor(ns.status),
          ns.resourceQuota.cpuLimit,
          ns.resourceQuota.memoryLimit,
          ns.resourceQuota.podLimit,
        ]);
      }

      console.log(table.toString());
      console.log();
    } catch (err: any) {
      spinner.fail(chalk.red(`Error: ${err.message}`));
    }
  });

namespacesCmd
  .command("create <teamId> <environment>")
  .description("Create a namespace (environment: dev | prod)")
  .action(async (teamId: string, environment: string) => {
    if (!["dev", "prod"].includes(environment)) {
      console.error(chalk.red("  Error: environment must be 'dev' or 'prod'"));
      process.exit(1);
    }
    const spinner = ora(`Provisioning ${chalk.cyan(environment)} namespace...`).start();
    try {
      const ns = await apiRequest<Namespace>("/namespaces", {
        method: "POST",
        body: JSON.stringify({ teamId: parseInt(teamId, 10), environment }),
      });
      spinner.succeed(chalk.green(`Namespace ${chalk.bold(ns.k8sNamespace)} provisioned!`));
      console.log();
      console.log(`  ${chalk.cyan("K8s Namespace:")} ${ns.k8sNamespace}`);
      console.log(`  ${chalk.cyan("Environment:")}   ${ns.environment}`);
      console.log(`  ${chalk.cyan("Status:")}        ${ns.status}`);
      console.log(`  ${chalk.cyan("CPU Limit:")}     ${ns.resourceQuota.cpuLimit}`);
      console.log(`  ${chalk.cyan("Memory Limit:")}  ${ns.resourceQuota.memoryLimit}`);
      console.log(`  ${chalk.cyan("Pod Limit:")}     ${ns.resourceQuota.podLimit}`);
      console.log();
    } catch (err: any) {
      spinner.fail(chalk.red(`Error: ${err.message}`));
    }
  });
