#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { loginCmd } from "./commands/login.js";
import { teamsCmd } from "./commands/teams.js";
import { namespacesCmd } from "./commands/namespaces.js";
import { deployCmd } from "./commands/deploy.js";
import { evidenceCmd } from "./commands/evidence.js";
import { starterKitsCmd } from "./commands/starterkits.js";

const program = new Command();

program
  .name("platform")
  .description(
    chalk.bold.blue("Platform Engineering CLI") +
    "\n" +
    chalk.gray("The unified control plane for your platform engineering experience.\n") +
    chalk.gray("Backed by Kubernetes, powered by GitOps, enforced by compliance.")
  )
  .version("1.0.0");

program.addCommand(loginCmd);
program.addCommand(teamsCmd);
program.addCommand(namespacesCmd);
program.addCommand(deployCmd);
program.addCommand(evidenceCmd);
program.addCommand(starterKitsCmd);

program.parse();
