const chalk = require('chalk');
const config = require('./config');

class FirewallManager {
  constructor() {
    this.isActive = false;
    this.activeProfile = null;
  }

  getStatus() {
    const profile = this.getActiveProfile();
    const settings = config.getSettings();
    const rules = config.getRules();
    
    return {
      active: this.isActive,
      profile: profile,
      settings: settings,
      rules: rules.filter(r => r.enabled)
    };
  }

  getActiveProfile() {
    return config.getActiveProfile();
  }

  async enable() {
    this.isActive = true;
    this.activeProfile = this.getActiveProfile();
    console.log(chalk.green('\n✓ Firewall enabled'));
    console.log(chalk.gray(`  Profile: ${this.activeProfile.name}`));
    return { status: 'enabled', profile: this.activeProfile.name };
  }

  async disable() {
    this.isActive = false;
    this.activeProfile = null;
    console.log(chalk.yellow('\n✓ Firewall disabled'));
    return { status: 'disabled' };
  }

  matchRule(target, pattern, type) {
    if (type === 'domain') {
      // Support wildcards
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$', 'i');
        return regex.test(target);
      }
      return target.toLowerCase().includes(pattern.toLowerCase());
    } else if (type === 'ip') {
      return target === pattern;
    }
    return false;
  }

  checkConnection(target, type = 'domain') {
    const rules = config.getRules().filter(r => r.enabled);
    
    // Sort by priority
    rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    for (const rule of rules) {
      if (this.matchRule(target, rule.pattern, rule.type)) {
        // Log the connection attempt
        config.addLog({
          target,
          type,
          action: rule.action,
          rule: rule.name
        });
        
        return {
          allowed: rule.action === 'allow',
          rule: rule.name,
          action: rule.action
        };
      }
    }

    // Default allow if no rule matches
    return { allowed: true, rule: null, action: 'default-allow' };
  }

  getRules() {
    return config.getRules();
  }

  addRule(rule) {
    return config.addRule(rule);
  }

  removeRule(id) {
    return config.removeRule(id);
  }

  toggleRule(id) {
    return config.toggleRule(id);
  }

  getProfiles() {
    return config.getProfiles();
  }

  setProfile(profileId) {
    config.setActiveProfile(profileId);
    this.activeProfile = config.getActiveProfile();
    if (this.isActive) {
      console.log(chalk.green(`\n✓ Switched to profile: ${this.activeProfile.name}`));
    }
    return this.activeProfile;
  }

  getLogs(limit = 20) {
    return config.getLogs(limit);
  }

  clearLogs() {
    config.clearLogs();
    console.log(chalk.green('\n✓ Logs cleared'));
  }

  simulateTraffic() {
    const domains = [
      'ads.google.com',
      'doubleclick.net',
      'google-analytics.com',
      'facebook.com',
      'twitter.com',
      'amazon.com',
      'netflix.com'
    ];

    const domain = domains[Math.floor(Math.random() * domains.length)];
    const result = this.checkConnection(domain);

    if (!result.allowed) {
      console.log(chalk.red(`\n🚫 Blocked: ${domain}`));
      console.log(chalk.gray(`  Rule: ${result.rule}`));
    }

    return { domain, ...result };
  }
}

module.exports = new FirewallManager();
