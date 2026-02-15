const chalk = require('chalk');
const inquirer = require('inquirer');
const Table = require('cli-table3');
const firewall = require('../services/firewall');

async function listRules() {
  const rules = firewall.getRules();

  const table = new Table({
    head: ['Name', 'Type', 'Pattern', 'Action', 'Priority', 'Enabled'],
    colWidths: [20, 10, 25, 10, 10, 10]
  });

  rules.forEach(rule => {
    const actionColor = rule.action === 'block' ? chalk.red : chalk.green;
    const enabledColor = rule.enabled ? chalk.green('✓') : chalk.gray('✗');

    table.push([
      rule.name,
      rule.type,
      rule.pattern,
      actionColor(rule.action),
      rule.priority || 0,
      enabledColor
    ]);
  });

  console.log(chalk.bold('\n🛡️ Firewall Rules'));
  console.log(table.toString());
}

async function addRule() {
  const questions = [
    {
      type: 'input',
      name: 'name',
      message: 'Rule name:',
      validate: (input) => input.trim() !== '' ? true : 'Name is required'
    },
    {
      type: 'list',
      name: 'type',
      message: 'Rule type:',
      choices: ['domain', 'ip', 'port']
    },
    {
      type: 'input',
      name: 'pattern',
      message: 'Pattern (e.g., *.ads.com, 192.168.1.1, 443):',
      validate: (input) => input.trim() !== '' ? true : 'Pattern is required'
    },
    {
      type: 'list',
      name: 'action',
      message: 'Action:',
      choices: ['block', 'allow']
    },
    {
      type: 'input',
      name: 'priority',
      message: 'Priority (higher = matched first):',
      default: '50',
      validate: (input) => !isNaN(parseInt(input)) ? true : 'Valid number required'
    }
  ];

  const answers = await inquirer.prompt(questions);

  const rule = firewall.addRule({
    name: answers.name,
    type: answers.type,
    pattern: answers.pattern,
    action: answers.action,
    priority: parseInt(answers.priority),
    enabled: true
  });

  console.log(chalk.green(`\n✓ Rule "${rule.name}" created successfully!`));
}

async function removeRule() {
  const rules = firewall.getRules();

  if (rules.length === 0) {
    console.log(chalk.yellow('\n🛡️ No rules to remove.'));
    return;
  }

  const choices = rules.map(r => ({
    name: `${r.name} (${r.action} ${r.pattern})`,
    value: r.id
  }));

  const { ruleId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'ruleId',
      message: 'Select rule to remove:',
      choices
    }
  ]);

  firewall.removeRule(ruleId);
  console.log(chalk.red('\n✗ Rule removed!'));
}

async function toggleRule() {
  const rules = firewall.getRules();

  if (rules.length === 0) {
    console.log(chalk.yellow('\n🛡️ No rules to toggle.'));
    return;
  }

  const choices = rules.map(r => ({
    name: `${r.name} (${r.enabled ? 'Enabled' : 'Disabled'})`,
    value: r.id
  }));

  const { ruleId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'ruleId',
      message: 'Select rule to toggle:',
      choices
    }
  ]);

  const rule = firewall.toggleRule(ruleId);
  console.log(chalk.green(`\n✓ Rule "${rule.name}" is now ${rule.enabled ? 'enabled' : 'disabled'}!`));
}

module.exports = {
  listRules,
  addRule,
  removeRule,
  toggleRule
};
