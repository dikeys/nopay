// Popup script for Paywall Bypass Extension
// Handles the extension popup interface

class PopupController {
  constructor() {
    this.currentTab = null;
    this.enabled = true;
    this.init();
  }

  async init() {
    try {
      // Get current tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tabs[0];

      // Load initial state
      await this.loadStatus();
      await this.checkCurrentSite();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Show content
      document.getElementById('loading').style.display = 'none';
      document.getElementById('content').style.display = 'block';
      
    } catch (error) {
      console.error('Popup initialization error:', error);
      this.showError('Failed to initialize popup');
    }
  }

  async loadStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getStatus' });
      this.enabled = response?.enabled !== false;
      this.updateStatusDisplay();
    } catch (error) {
      console.error('Error loading status:', error);
      this.enabled = true; // Default to enabled
      this.updateStatusDisplay();
    }
  }

  updateStatusDisplay() {
    const statusEl = document.getElementById('status');
    const statusTextEl = document.getElementById('status-text');
    const toggleBtnEl = document.getElementById('toggle-btn');

    if (this.enabled) {
      statusEl.className = 'status enabled';
      statusTextEl.textContent = 'Extension Enabled';
      toggleBtnEl.textContent = 'Disable';
      toggleBtnEl.className = 'toggle-btn';
    } else {
      statusEl.className = 'status disabled';
      statusTextEl.textContent = 'Extension Disabled';
      toggleBtnEl.textContent = 'Enable';
      toggleBtnEl.className = 'toggle-btn disabled';
    }
  }

  async checkCurrentSite() {
    if (!this.currentTab?.url) {
      this.updateSiteDisplay('Unknown Site', 'Unable to detect current site', false);
      return;
    }

    try {
      const url = new URL(this.currentTab.url);
      const hostname = url.hostname;
      
      // Check if site is supported
      const isSupported = await this.isSiteSupported(hostname);
      
      this.updateSiteDisplay(
        this.formatHostname(hostname),
        isSupported ? 'Supported site ✓' : 'Not supported',
        isSupported
      );
      
    } catch (error) {
      console.error('Error checking site:', error);
      this.updateSiteDisplay('Invalid URL', 'Cannot process this page', false);
    }
  }

  async isSiteSupported(hostname) {
    // Check against known supported sites
    const supportedSites = [
      'nytimes.com', 'wsj.com', 'washingtonpost.com', 'economist.com',
      'ft.com', 'bloomberg.com', 'reuters.com', 'medium.com',
      'telegraph.co.uk', 'wired.com', 'newyorker.com', 'theatlantic.com',
      'lemonde.fr', 'lefigaro.fr', 'zeit.de', 'substack.com'
    ];

    const isBuiltInSupported = supportedSites.some(site => hostname.includes(site));
    
    if (isBuiltInSupported) return true;

    // Check custom sites
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getCustomSites' });
      const customSites = response?.sites || [];
      return customSites.some(site => hostname.includes(site));
    } catch (error) {
      console.error('Error checking custom sites:', error);
      return false;
    }
  }

  updateSiteDisplay(siteName, status, isSupported) {
    document.getElementById('site-name').textContent = siteName;
    const statusEl = document.getElementById('site-status');
    statusEl.textContent = status;
    statusEl.className = isSupported ? 'site-status supported' : 'site-status not-supported';
  }

  formatHostname(hostname) {
    // Remove www. prefix and show clean domain name
    return hostname.replace(/^www\./, '');
  }

  setupEventListeners() {
    // Toggle extension
    document.getElementById('toggle-btn').addEventListener('click', async () => {
      try {
        const response = await chrome.runtime.sendMessage({ action: 'toggle' });
        this.enabled = response?.enabled !== false;
        this.updateStatusDisplay();
        
        // Reload current tab to apply changes
        if (this.currentTab) {
          chrome.tabs.reload(this.currentTab.id);
        }
      } catch (error) {
        console.error('Error toggling extension:', error);
        this.showError('Failed to toggle extension');
      }
    });

    // Clear cookies and refresh
    document.getElementById('clear-cookies').addEventListener('click', async () => {
      if (!this.currentTab?.url) return;

      try {
        const url = new URL(this.currentTab.url);
        const domain = url.hostname;

        // Clear cookies
        await chrome.runtime.sendMessage({ 
          action: 'clearCookies', 
          domain: domain 
        });
        
        // Refresh page
        await chrome.tabs.reload(this.currentTab.id);
        
        // Close popup
        window.close();
        
      } catch (error) {
        console.error('Error clearing cookies:', error);
        this.showError('Failed to clear cookies');
      }
    });

    // Add current site as custom
    document.getElementById('add-custom-site').addEventListener('click', async () => {
      if (!this.currentTab?.url) return;

      try {
        const url = new URL(this.currentTab.url);
        const domain = url.hostname;

        await chrome.runtime.sendMessage({ 
          action: 'addCustomSite', 
          domain: domain 
        });
        
        // Update site status
        this.updateSiteDisplay(
          this.formatHostname(domain),
          'Added as custom site ✓',
          true
        );
        
        this.showSuccess('Site added successfully!');
        
      } catch (error) {
        console.error('Error adding custom site:', error);
        this.showError('Failed to add site');
      }
    });

    // Open options page
    document.getElementById('options').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
      window.close();
    });

    // Help link
    document.getElementById('help-link').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ 
        url: 'https://github.com/magnolia1234/bypass-paywalls-chrome-clean' 
      });
      window.close();
    });
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
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      right: 10px;
      padding: 10px;
      border-radius: 5px;
      font-size: 12px;
      font-weight: 500;
      z-index: 1000;
      animation: slideIn 0.3s ease;
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

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});