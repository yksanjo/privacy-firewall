const chalk = require('chalk');
const firewall = require('../services/firewall');

function showStatus() {
  const status = firewall.getStatus();
  
  console.log(chalk.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.bold('  🛡️ Privacy Firewall - Status'));
  console.log(chalk.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  // Firewall Status
  const fwStatus = status.active ? chalk.green('ACTIVE') : chalk.gray('INACTIVE');
  console.log(chalk.bold('  Firewall: ') + fwStatus);

  // Profile
  if (status.profile) {
    console.log(chalk.bold('\n  📋 Active Profile: ') + chalk.cyan(status.profile.name));
    console.log(chalk.gray('  Description: ') + status.profile.description);
  }

  // Statistics
  console.log(chalk.bold('\n  📊 Statistics:'));
  console.log(chalk.red('    Blocked: ') + status.settings.stats.blocked);
  console.log(chalk.green('    Allowed: ') + status.settings.stats.allowed);

  // Active Rules
  console.log(chalk.bold('\n  📝 Active Rules: ') + status.rules.length);

  console.log(chalk.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
}

function showLogs() {
  const logs = firewall.getLogs(20);

  if (logs.length === 0) {
    console.log(chalk.yellow('\n📜 No logs available.'));
    return;
  }

  console.log(chalk.bold('\n📜 Recent Logs\n'));

  logs.reverse().forEach(log => {
    const timestamp = new Date(log.timestamp).toLocaleTimeString();
    const actionColor = log.action === 'block' ? chalk.red : chalk.green;
    const icon = log.action === 'block' ? '🚫' : '✓';

    console.log(chalk.gray(`  ${timestamp} `) + actionColor(`${icon} ${log.action.toUpperCase()}`));
    console.log(chalk.gray(`    Target: ${log.target}`));
    if (log.rule) {
      console.log(chalk.gray(`    Rule: ${log.rule}`));
    }
    console.log('');
  });
}

function listProfiles() {
  const profiles = firewall.getProfiles();
  const activeProfile = firewall.getActiveProfile();

  console.log(chalk.bold('\n📋 Privacy Profiles\n'));

  profiles.forEach(profile => {
    const isActive = profile.id === activeProfile.id;
    const icon = isActive ? chalk.green('●') : chalk.gray('○');

    console.log(chalk `${icon} ${profile.name}`).join('');
    console.log(chalk.gray(`  ${profile.description}`));
    console.log(chalk.gray(`  Rules: ${profile.rules.length}\n`));
  });
}

async function switchProfile() {
  const profiles = firewall.getProfiles();

  const choices = profiles.map(p => ({
    name: p.name + (p.description ? ` - ${p.description}` : ''),
    value: p.id
  }));

  const inquirer = require('inquirer');
  const { profileId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'profileId',
      message: 'Select profile to activate:',
      choices
    }
  ]);

  firewall.setProfile(profileId);
}

module.exports = {
  showStatus,
  showLogs,
  listProfiles,
  switchProfile
};
