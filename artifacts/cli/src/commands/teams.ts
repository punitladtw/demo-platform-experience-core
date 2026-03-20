import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import Table from "cli-table3";
import { apiRequest } from "../lib/api.js";

interface Team {
  id: number;
  name: string;
  slug: string;
  description?: string;
  memberCount: number;
  namespaceCount: number;
  createdAt: string;
}

interface TeamMember {
  id: number;
  role: string;
  user: { username: string; displayName: string; role: string };
}

export const teamsCmd = new Command("teams").description("Manage platform teams");

teamsCmd
  .command("list")
  .description("List all teams")
  .action(async () => {
    const spinner = ora("Fetching teams...").start();
    try {
      const teams = await apiRequest<Team[]>("/teams");
      spinner.stop();
      console.log();
      console.log(chalk.bold.blue("  Platform Teams"));
      console.log();

      if (teams.length === 0) {
        console.log(chalk.gray("  No teams found."));
        return;
      }

      const table = new Table({
        head: [
          chalk.bold("ID"),
          chalk.bold("Name"),
          chalk.bold("Slug"),
          chalk.bold("Members"),
          chalk.bold("Namespaces"),
          chalk.bold("Description"),
        ],
        style: { head: [], border: [] },
      });

      for (const team of teams) {
        table.push([
          team.id,
          chalk.cyan(team.name),
          chalk.gray(team.slug),
          team.memberCount,
          team.namespaceCount,
          chalk.gray(team.description ?? "—"),
        ]);
      }

      console.log(table.toString());
      console.log();
      console.log(chalk.gray(`  ${teams.length} team(s) total`));
      console.log();
    } catch (err: any) {
      spinner.fail(chalk.red(`Error: ${err.message}`));
    }
  });

teamsCmd
  .command("create <name> <slug>")
  .description("Create a new team")
  .option("-d, --description <desc>", "Team description")
  .action(async (name: string, slug: string, opts: { description?: string }) => {
    const spinner = ora(`Creating team ${chalk.cyan(name)}...`).start();
    try {
      const team = await apiRequest<Team>("/teams", {
        method: "POST",
        body: JSON.stringify({ name, slug, description: opts.description }),
      });
      spinner.succeed(chalk.green(`Team ${chalk.bold(team.name)} created!`));
      console.log();
      console.log(`  ${chalk.cyan("ID:")}          ${team.id}`);
      console.log(`  ${chalk.cyan("Name:")}        ${team.name}`);
      console.log(`  ${chalk.cyan("Slug:")}        ${team.slug}`);
      console.log(`  ${chalk.cyan("Description:")} ${team.description ?? "—"}`);
      console.log();
    } catch (err: any) {
      spinner.fail(chalk.red(`Error: ${err.message}`));
    }
  });

teamsCmd
  .command("delete <teamId>")
  .description("Delete a team by ID")
  .action(async (teamId: string) => {
    const spinner = ora(`Deleting team ${teamId}...`).start();
    try {
      await apiRequest(`/teams/${teamId}`, { method: "DELETE" });
      spinner.succeed(chalk.green(`Team ${teamId} deleted.`));
    } catch (err: any) {
      spinner.fail(chalk.red(`Error: ${err.message}`));
    }
  });

teamsCmd
  .command("members <teamId>")
  .description("List members of a team")
  .action(async (teamId: string) => {
    const spinner = ora("Fetching members...").start();
    try {
      const members = await apiRequest<TeamMember[]>(`/teams/${teamId}/members`);
      spinner.stop();
      console.log();
      console.log(chalk.bold.blue(`  Team Members (Team ID: ${teamId})`));
      console.log();

      const table = new Table({
        head: [chalk.bold("Username"), chalk.bold("Display Name"), chalk.bold("Team Role"), chalk.bold("Org Role")],
        style: { head: [], border: [] },
      });

      for (const m of members) {
        table.push([
          chalk.cyan(m.user.username),
          m.user.displayName,
          m.role === "owner" ? chalk.yellow("owner") : chalk.gray("member"),
          m.user.role === "admin" ? chalk.red("admin") : chalk.green("member"),
        ]);
      }

      console.log(table.toString());
      console.log();
    } catch (err: any) {
      spinner.fail(chalk.red(`Error: ${err.message}`));
    }
  });
