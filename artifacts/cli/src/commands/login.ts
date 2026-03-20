import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { apiRequest, saveConfig, clearConfig } from "../lib/api.js";

interface User {
  id: number;
  username: string;
  displayName: string;
  role: string;
  email?: string;
}

export const loginCmd = new Command("login")
  .description("Authenticate with the platform (via GitHub SSO)")
  .action(async () => {
    console.log();
    console.log(chalk.bold.blue("  Platform Engineering CLI — Login"));
    console.log(chalk.gray("  ─────────────────────────────────"));
    console.log();
    console.log(chalk.yellow("  To authenticate, open your browser and navigate to:"));
    console.log();
    console.log(chalk.cyan("    http://localhost:80/api/auth/github"));
    console.log();
    console.log(chalk.gray("  This will redirect you to GitHub for SSO authentication."));
    console.log(chalk.gray("  After login, your session will be active in the web portal."));
    console.log();

    const spinner = ora("Checking session status...").start();

    try {
      const user = await apiRequest<User>("/auth/me");
      spinner.succeed(chalk.green("Already authenticated!"));
      console.log();
      console.log(chalk.bold("  Logged in as:"));
      console.log(`    ${chalk.cyan("Username:")}  ${user.username}`);
      console.log(`    ${chalk.cyan("Name:")}      ${user.displayName}`);
      console.log(`    ${chalk.cyan("Role:")}      ${user.role === "admin" ? chalk.red("admin") : chalk.green("member")}`);
      console.log();

      saveConfig({ username: user.username, role: user.role });
    } catch {
      spinner.warn(chalk.yellow("Not authenticated. Visit the URL above to login."));
      console.log();
    }
  });

export const logoutCmd = new Command("logout")
  .description("Log out of the platform")
  .action(async () => {
    const spinner = ora("Logging out...").start();
    try {
      await apiRequest("/auth/logout", { method: "POST" });
      clearConfig();
      spinner.succeed(chalk.green("Logged out successfully."));
    } catch {
      clearConfig();
      spinner.succeed(chalk.green("Logged out."));
    }
  });
