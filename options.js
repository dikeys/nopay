// Options page script for Paywall Bypass Extension
// Handles the options/settings interface

class OptionsController {
  constructor() {
    this.settings = {
      enabled: true,
      autoClear: true,
      useGooglebot: true,
      blockScripts: true
    };
    this.customSites = new Set();
    this.init();
  }

  async init() {
    try {
      await this.loadSettings();
      await this.loadCustomSites();
      this.setupEventListeners();
      this.updateUI();
    } catch (error) {
      console.error('Options initialization error:', error);
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'enabled', 'autoClear', 'useGooglebot', 'blockScripts'
      ]);
      
      this.settings = {
        enabled: result.enabled !== false,
        autoClear: result.autoClear !== false,
        useGooglebot: result.useGooglebot !== false,
        blockScripts: result.blockScripts !== false
      };
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set(this.settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  async loadCustomSites() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getCustomSites' });
      this.customSites = new Set(response?.sites || []);
      this.updateCustomSitesList();
      this.updateStats();
    } catch (error) {
      console.error('Error loading custom sites:', error);
    }
  }

  updateUI() {
    // Update toggle switches
    this.updateToggle('enable-toggle', this.settings.enabled);
    this.updateToggle('auto-clear-toggle', this.settings.autoClear);
    this.updateToggle('googlebot-toggle', this.settings.useGooglebot);
    this.updateToggle('block-scripts-toggle', this.settings.blockScripts);
  }

  updateToggle(id, active) {
    const toggle = document.getElementById(id);
    if (toggle) {
      toggle.className = active ? 'toggle-switch active' : 'toggle-switch';
    }
  }

  updateCustomSitesList() {
    const container = document.getElementById('custom-sites-list');
    container.innerHTML = '';

    if (this.customSites.size === 0) {
      container.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">No custom sites added yet</div>';
      return;
    }

    Array.from(this.customSites).sort().forEach(site => {
      const siteItem = document.createElement('div');
      siteItem.className = 'site-item';
      siteItem.innerHTML = `
        <span class="site-domain">${site}</span>
        <button class="remove-btn" data-site="${site}">Remove</button>
      `;
      container.appendChild(siteItem);
    });

    // Add event listeners for remove buttons
    container.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const site = e.target.dataset.site;
        this.removeCustomSite(site);
      });
    });
  }

  updateStats() {
    document.getElementById('custom-count').textContent = this.customSites.size;
    
    // Update supported sites count (approximate)
    document.getElementById('supported-count').textContent = '40+';
    
    // Get bypassed count from storage (would be implemented with usage tracking)
    this.getBypassedCount().then(count => {
      document.getElementById('bypassed-count').textContent = count;
    });
  }

  async getBypassed count() {
    try {
      const result = await chrome.storage.local.get(['bypassedToday']);
      const today = new Date().toDateString();
      const data = result.bypassedToday || {};
      return data[today] || 0;
    } catch (error) {
      return 0;
    }
  }

  setupEventListeners() {
    // Toggle switches
    document.getElementById('enable-toggle').addEventListener('click', () => {
      this.settings.enabled = !this.settings.enabled;
      this.updateToggle('enable-toggle', this.settings.enabled);
      this.saveSettings();
      
      // Notify background script
      chrome.runtime.sendMessage({ 
        action: 'updateSettings', 
        settings: this.settings 
      });
    });

    document.getElementById('auto-clear-toggle').addEventListener('click', () => {
      this.settings.autoClear = !this.settings.autoClear;
      this.updateToggle('auto-clear-toggle', this.settings.autoClear);
      this.saveSettings();
    });

    document.getElementById('googlebot-toggle').addEventListener('click', () => {
      this.settings.useGooglebot = !this.settings.useGooglebot;
      this.updateToggle('googlebot-toggle', this.settings.useGooglebot);
      this.saveSettings();
    });

    document.getElementById('block-scripts-toggle').addEventListener('click', () => {
      this.settings.blockScripts = !this.settings.blockScripts;
      this.updateToggle('block-scripts-toggle', this.settings.blockScripts);
      this.saveSettings();
    });

    // Add custom site
    document.getElementById('add-site-btn').addEventListener('click', () => {
      this.addCustomSite();
    });

    document.getElementById('site-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addCustomSite();
      }
    });

    // Help link
    document.getElementById('help-link').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ 
        url: 'https://github.com/magnolia1234/bypass-paywalls-chrome-clean#readme' 
      });
    });
  }

  async addCustomSite() {
    const input = document.getElementById('site-input');
    const domain = input.value.trim().toLowerCase();

    if (!domain) return;

    // Validate domain format
    if (!this.isValidDomain(domain)) {
      this.showError('Please enter a valid domain name (e.g., example.com)');
      return;
    }

    // Check if already exists
    if (this.customSites.has(domain)) {
      this.showError('This site is already in your custom sites list');
      return;
    }

    try {
      // Add to custom sites
      await chrome.runtime.sendMessage({ 
        action: 'addCustomSite', 
        domain: domain 
      });
      
      this.customSites.add(domain);
      this.updateCustomSitesList();
      this.updateStats();
      
      // Clear input
      input.value = '';
      
      this.showSuccess(`Added ${domain} to custom sites`);
      
    } catch (error) {
      console.error('Error adding custom site:', error);
      this.showError('Failed to add site');
    }
  }

  async removeCustomSite(domain) {
    try {
      await chrome.runtime.sendMessage({ 
        action: 'removeCustomSite', 
        domain: domain 
      });
      
      this.customSites.delete(domain);
      this.updateCustomSitesList();
      this.updateStats();
      
      this.showSuccess(`Removed ${domain} from custom sites`);
      
    } catch (error) {
      console.error('Error removing custom site:', error);
      this.showError('Failed to remove site');
    }
  }

  isValidDomain(domain) {
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    return domainRegex.test(domain) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(domain);
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 5px;
      font-size: 14px;
      font-weight: 500;
      z-index: 1000;
      animation: slideInRight 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    // Style based on type
    if (type === 'error') {
      notification.style.background = '#dc3545';
      notification.style.color = 'white';
    } else if (type === 'success') {
      notification.style.background = '#28a745';
      notification.style.color = 'white';
    } else {
      notification.style.background = '#007bff';
      notification.style.color = 'white';
    }

    notification.textContent = message;
    document.body.appendChild(notification);

    // Remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOutRight {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize options page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new OptionsController();
});