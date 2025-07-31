// Background script for Paywall Bypass Extension
// Handles web requests, cookies, and communication with content scripts

class PaywallBypassBackground {
  constructor() {
    this.enabled = true;
    this.customSites = new Set();
    this.bypassedSites = new Set();
    this.init();
  }

  init() {
    // Initialize extension
    chrome.runtime.onInstalled.addListener(() => {
      this.loadSettings();
    });

    // Handle web requests
    chrome.webRequest.onBeforeSendHeaders.addListener(
      (details) => this.handleRequest(details),
      { urls: ["*://*/*"] },
      ["blocking", "requestHeaders"]
    );

    // Handle messages from content scripts
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep channel open for async response
    });

    // Context menu for quick bypass
    chrome.contextMenus.create({
      id: "bypassPaywall",
      title: "Bypass Paywall",
      contexts: ["page"]
    });

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === "bypassPaywall") {
        this.bypassCurrentSite(tab);
      }
    });
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['enabled', 'customSites']);
      this.enabled = result.enabled !== false; // Default to true
      this.customSites = new Set(result.customSites || []);
    } catch (error) {
      console.log('Settings loaded with defaults');
    }
  }

  async saveSettings() {
    await chrome.storage.sync.set({
      enabled: this.enabled,
      customSites: Array.from(this.customSites)
    });
  }

  handleRequest(details) {
    if (!this.enabled) return {};

    const url = new URL(details.url);
    const domain = url.hostname.toLowerCase();

    // Check if this is a supported site
    if (this.shouldBypass(domain)) {
      return this.modifyHeaders(details, domain);
    }

    return {};
  }

  shouldBypass(domain) {
    // Check against supported sites list
    const supportedSites = [
      'nytimes.com', 'wsj.com', 'washingtonpost.com', 'economist.com',
      'ft.com', 'bloomberg.com', 'reuters.com', 'apnews.com',
      'latimes.com', 'bostonglobe.com', 'atlantico.fr', 'lemonde.fr',
      'telegraph.co.uk', 'theguardian.com', 'independent.co.uk',
      'medium.com', 'substack.com', 'wired.com', 'newyorker.com',
      'theatlantic.com', 'harpers.org', 'nationalreview.com',
      'slate.com', 'vox.com', 'politico.com', 'axios.com'
    ];

    return supportedSites.some(site => domain.includes(site)) || 
           this.customSites.has(domain);
  }

  modifyHeaders(details, domain) {
    const headers = details.requestHeaders || [];
    
    // Remove paywall-related headers
    const filteredHeaders = headers.filter(header => {
      const name = header.name.toLowerCase();
      return !['x-forwarded-for', 'x-real-ip'].includes(name);
    });

    // Add bypass headers based on site
    const bypassHeaders = this.getBypassHeaders(domain);
    filteredHeaders.push(...bypassHeaders);

    return { requestHeaders: filteredHeaders };
  }

  getBypassHeaders(domain) {
    const headers = [];

    // Common bypass techniques
    if (domain.includes('nytimes.com') || domain.includes('wsj.com')) {
      headers.push({
        name: 'User-Agent',
        value: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      });
      headers.push({
        name: 'Referer',
        value: 'https://www.google.com/'
      });
    } else if (domain.includes('medium.com')) {
      headers.push({
        name: 'User-Agent',
        value: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      });
    } else if (domain.includes('bloomberg.com')) {
      headers.push({
        name: 'Referer',
        value: 'https://www.google.com/'
      });
    } else {
      // Generic bypass
      headers.push({
        name: 'User-Agent',
        value: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      });
      headers.push({
        name: 'Referer',
        value: 'https://www.google.com/'
      });
    }

    return headers;
  }

  async handleMessage(message, sender, sendResponse) {
    switch (message.action) {
      case 'getStatus':
        sendResponse({ enabled: this.enabled });
        break;
        
      case 'toggle':
        this.enabled = !this.enabled;
        await this.saveSettings();
        sendResponse({ enabled: this.enabled });
        break;
        
      case 'clearCookies':
        await this.clearSiteCookies(message.domain);
        sendResponse({ success: true });
        break;
        
      case 'addCustomSite':
        this.customSites.add(message.domain);
        await this.saveSettings();
        sendResponse({ success: true });
        break;
        
      case 'removeCustomSite':
        this.customSites.delete(message.domain);
        await this.saveSettings();
        sendResponse({ success: true });
        break;
        
      case 'getCustomSites':
        sendResponse({ sites: Array.from(this.customSites) });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  async clearSiteCookies(domain) {
    try {
      const cookies = await chrome.cookies.getAll({ domain });
      for (const cookie of cookies) {
        await chrome.cookies.remove({
          url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
          name: cookie.name
        });
      }
      console.log(`Cleared ${cookies.length} cookies for ${domain}`);
    } catch (error) {
      console.error('Error clearing cookies:', error);
    }
  }

  async bypassCurrentSite(tab) {
    if (!tab || !tab.url) return;
    
    const url = new URL(tab.url);
    const domain = url.hostname;
    
    // Clear cookies
    await this.clearSiteCookies(domain);
    
    // Reload page
    chrome.tabs.reload(tab.id);
    
    // Add to bypassed sites for this session
    this.bypassedSites.add(domain);
  }
}

// Initialize background script
new PaywallBypassBackground();