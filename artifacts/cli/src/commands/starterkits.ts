import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import Table from "cli-table3";
import { apiRequest } from "../lib/api.js";

interface StarterKit {
  id: number;
  name: string;
  description: string;
  category: string;
  language: string;
  framework: string;
  tags: string[];
  dockerfileIncluded: boolean;
  cicdIncluded: boolean;
  complianceReady: boolean;
}

export const starterKitsCmd = new Command("starterkits").description("Browse available starter kits");

starterKitsCmd
  .command("list")
  .description("List all available starter kits")
  .option("--category <category>", "Filter by category (web|api|worker|ml|data)")
  .action(async (opts: { category?: string }) => {
    const spinner = ora("Fetching starter kits...").start();
    try {
      let kits = await apiRequest<StarterKit[]>("/starterkits");
      if (opts.category) {
        kits = kits.filter((k) => k.category === opts.category);
      }
      spinner.stop();

      console.log();
      console.log(chalk.bold.blue("  Platform Starter Kits"));
      console.log();

      if (kits.length === 0) {
        console.log(chalk.gray("  No starter kits found."));
        return;
      }

      const table = new Table({
        head: [
          chalk.bold("ID"),
          chalk.bold("Name"),
          chalk.bold("Category"),
          chalk.bold("Language"),
          chalk.bold("Framework"),
          chalk.bold("Dockerfile"),
          chalk.bold("CI/CD"),
          chalk.bold("Compliance"),
        ],
        style: { head: [], border: [] },
      });

      for (const kit of kits) {
        const check = (v: boolean) => v ? chalk.green("✓") : chalk.red("✗");
        table.push([
          kit.id,
          chalk.cyan(kit.name),
          chalk.gray(kit.category),
          kit.language,
          kit.framework,
          check(kit.dockerfileIncluded),
          check(kit.cicdIncluded),
          check(kit.complianceReady),
        ]);
      }

      console.log(table.toString());
      console.log();
      console.log(chalk.gray(`  ${kits.length} starter kit(s) available`));
      console.log();
    } catch (err: any) {
      spinner.fail(chalk.red(`Error: ${err.message}`));
    }
  });
