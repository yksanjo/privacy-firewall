const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor() {
    this.dataDir = path.join(__dirname, '..', '..', 'data');
    this.rulesFile = path.join(this.dataDir, 'rules.json');
    this.profilesFile = path.join(this.dataDir, 'profiles.json');
    this.logsFile = path.join(this.dataDir, 'logs.json');
    this.settingsFile = path.join(this.dataDir, 'settings.json');

    this.ensureDataDir();
    this.initializeFiles();
  }

  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  initializeFiles() {
    const defaults = {
      rules: [
        {
          id: 'block-ads',
          name: 'Block Ads',
          type: 'domain',
          pattern: '*.doubleclick.net',
          action: 'block',
          priority: 100,
          enabled: true
        },
        {
          id: 'block-trackers',
          name: 'Block Trackers',
          type: 'domain',
          pattern: '*.google-analytics.com',
          action: 'block',
          priority: 90,
          enabled: true
        }
      ],
      profiles: [
        {
          id: 'default',
          name: 'Default',
          description: 'Basic privacy protection',
          rules: ['block-ads', 'block-trackers'],
          enabled: true
        },
        {
          id: 'strict',
          name: 'Strict',
          description: 'Maximum privacy and security',
          rules: ['block-ads', 'block-trackers'],
          enabled: true
        },
        {
          id: 'gaming',
          name: 'Gaming',
          description: 'Optimized for gaming',
          rules: [],
          enabled: true
        }
      ],
      logs: [],
      settings: {
        activeProfile: 'default',
        logging: true,
        stats: { blocked: 0, allowed: 0 }
      }
    };

    Object.keys(defaults).forEach(key => {
      const filePath = this.getFilePath(key);
      if (!fs.existsSync(filePath)) {
        this.writeJson(key, defaults[key]);
      }
    });
  }

  getFilePath(type) {
    switch (type) {
      case 'rules': return this.rulesFile;
      case 'profiles': return this.profilesFile;
      case 'logs': return this.logsFile;
      case 'settings': return this.settingsFile;
      default: return null;
    }
  }

  readJson(type) {
    const filePath = this.getFilePath(type);
    if (!filePath) return null;
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  writeJson(type, data) {
    const filePath = this.getFilePath(type);
    if (!filePath) return false;
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      return false;
    }
  }

  getRules() {
    return this.readJson('rules') || [];
  }

  addRule(rule) {
    const rules = this.getRules();
    rule.id = 'rule-' + Date.now().toString(36);
    rule.createdAt = new Date().toISOString();
    rules.push(rule);
    this.writeJson('rules', rules);
    return rule;
  }

  removeRule(id) {
    const rules = this.getRules().filter(r => r.id !== id);
    this.writeJson('rules', rules);
    return true;
  }

  toggleRule(id) {
    const rules = this.getRules();
    const rule = rules.find(r => r.id === id);
    if (rule) {
      rule.enabled = !rule.enabled;
      this.writeJson('rules', rules);
    }
    return rule;
  }

  getProfiles() {
    return this.readJson('profiles') || [];
  }

  getActiveProfile() {
    const settings = this.readJson('settings');
    const profiles = this.getProfiles();
    return profiles.find(p => p.id === settings.activeProfile) || profiles[0];
  }

  setActiveProfile(profileId) {
    const settings = this.readJson('settings');
    settings.activeProfile = profileId;
    this.writeJson('settings', settings);
    return true;
  }

  getLogs(limit = 50) {
    const logs = this.readJson('logs') || [];
    return logs.slice(-limit);
  }

  addLog(entry) {
    const logs = this.getLogs();
    entry.id = 'log-' + Date.now().toString(36);
    entry.timestamp = new Date().toISOString();
    logs.push(entry);
    
    // Keep only last 1000 logs
    if (logs.length > 1000) {
      logs.shift();
    }
    
    this.writeJson('logs', logs);
    
    // Update stats
    const settings = this.readJson('settings');
    if (entry.action === 'block') {
      settings.stats.blocked++;
    } else {
      settings.stats.allowed++;
    }
    this.writeJson('settings', settings);
    
    return entry;
  }

  getSettings() {
    return this.readJson('settings');
  }

  clearLogs() {
    this.writeJson('logs', []);
  }
}

module.exports = new ConfigManager();
