#!/usr/bin/env node

const chalk = require('chalk');
const figlet = require('figlet');

// Import commands
const ruleCmd = require('./commands/rule');
const statusCmd = require('./commands/status');
const firewall = require('./services/firewall');

// Simple argument parser
function parseArgs(args) {
  const result = {
    command: null,
    subcommand: null,
    options: {}
  };

  if (args.length < 3) {
    return result;
  }

  const parts = args.slice(2);

  if (parts.length === 0) {
    result.command = 'help';
    return result;
  }

  const flagIndex = parts.findIndex(p => p && p.startsWith('--'));
  let cmdParts = flagIndex === -1 ? parts : parts.slice(0, flagIndex);

  result.command = cmdParts[0];
  result.subcommand = cmdParts[1] || null;

  if (flagIndex !== -1) {
    for (let i = flagIndex; i < parts.length; i++) {
      const flag = parts[i];
      if (flag && flag.startsWith('--')) {
        const flagParts = flag.split('=');
        const key = flagParts[0].replace('--', '');
        result.options[key] = flagParts[1] || true;
      }
    }
  }

  return result;
}

function showBanner() {
  console.log(chalk.cyan(figlet.textSync('Privacy FW', {
    font: 'Standard',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  })));
  console.log(chalk.bold.cyan('  v1.0.0'));
  console.log(chalk.gray('  Manage firewall rules & privacy profiles\n'));
}

function showHelp() {
  console.log(chalk.bold('\n📖 Usage:'));
  console.log('  privacy-fw <command> [options]\n');

  console.log(chalk.bold('\n🔧 Commands:'));
  console.log('  rule <action>     Manage firewall rules');
  console.log('    list            List all rules');
  console.log('    add             Add a new rule');
  console.log('    remove          Remove a rule');
  console.log('    toggle          Enable/disable a rule');
  console.log('');
  console.log('  profile          Manage privacy profiles');
  console.log('  status           Show firewall status');
  console.log('  logs             Show connection logs');
  console.log('  enable           Enable firewall');
  console.log('  disable          Disable firewall');
  console.log('  help             Show this help message');

  console.log(chalk.bold('\n📌 Examples:'));
  console.log('  privacy-fw rule list');
  console.log('  privacy-fw rule add');
  console.log('  privacy-fw enable');
  console.log('  privacy-fw status\n');
}

async function main() {
  const args = parseArgs(process.argv);
  const { command, subcommand, options } = args;

  if (!command || command === 'help') {
    showBanner();
    showHelp();
    return;
  }

  try {
    switch (command) {
      case 'rule':
        if (!subcommand || subcommand === 'list') {
          await ruleCmd.listRules();
        } else if (subcommand === 'add') {
          await ruleCmd.addRule();
        } else if (subcommand === 'remove') {
          await ruleCmd.removeRule();
        } else if (subcommand === 'toggle') {
          await ruleCmd.toggleRule();
        } else {
          console.log(chalk.yellow(`Unknown rule command: ${subcommand}`));
        }
        break;

      case 'profile':
        statusCmd.listProfiles();
        break;

      case 'status':
        statusCmd.showStatus();
        break;

      case 'logs':
        statusCmd.showLogs();
        break;

      case 'enable':
        await firewall.enable();
        break;

      case 'disable':
        await firewall.disable();
        break;

      default:
        console.log(chalk.yellow(`Unknown command: ${command}`));
        console.log(chalk.gray('Use: privacy-fw help'));
    }
  } catch (error) {
    console.error(chalk.red('\n✗ Error:'), error.message);
    process.exit(1);
  }
}

main();
