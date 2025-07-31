// Background script for Paywall Bypass Extension
// Handles cookies, storage, and communication with content scripts

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
      this.setupDeclarativeRules();
    });

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

  async setupDeclarativeRules() {
    // Clear existing rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: await chrome.declarativeNetRequest.getDynamicRules().then(rules => rules.map(r => r.id))
    });

    // Add rules for supported sites
    const rules = [];
    let ruleId = 1;

    const supportedSites = [
      'nytimes.com', 'wsj.com', 'washingtonpost.com', 'economist.com',
      'ft.com', 'bloomberg.com', 'reuters.com', 'medium.com',
      'telegraph.co.uk', 'wired.com', 'newyorker.com', 'theatlantic.com'
    ];

    supportedSites.forEach(site => {
      // Rule to modify User-Agent header
      rules.push({
        id: ruleId++,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            {
              header: "User-Agent",
              operation: "set",
              value: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
            }
          ]
        },
        condition: {
          urlFilter: `*://*.${site}/*`,
          resourceTypes: ["main_frame", "sub_frame"]
        }
      });

      // Rule to modify Referer header
      rules.push({
        id: ruleId++,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            {
              header: "Referer",
              operation: "set",
              value: "https://www.google.com/"
            }
          ]
        },
        condition: {
          urlFilter: `*://*.${site}/*`,
          resourceTypes: ["main_frame", "sub_frame"]
        }
      });
    });

    // Apply the rules
    if (rules.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: rules
      });
    }
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
        await this.updateCustomSiteRules();
        sendResponse({ success: true });
        break;
        
      case 'removeCustomSite':
        this.customSites.delete(message.domain);
        await this.saveSettings();
        await this.updateCustomSiteRules();
        sendResponse({ success: true });
        break;
        
      case 'getCustomSites':
        sendResponse({ sites: Array.from(this.customSites) });
        break;
        
      case 'updateSettings':
        Object.assign(this.settings, message.settings);
        await this.saveSettings();
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
  }

  async updateCustomSiteRules() {
    // Update declarative rules to include custom sites
    await this.setupDeclarativeRules();
    
    // Add rules for custom sites
    const customRules = [];
    let ruleId = 1000; // Start from high number to avoid conflicts

    Array.from(this.customSites).forEach(site => {
      customRules.push({
        id: ruleId++,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            {
              header: "User-Agent",
              operation: "set",
              value: "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
            }
          ]
        },
        condition: {
          urlFilter: `*://*.${site}/*`,
          resourceTypes: ["main_frame", "sub_frame"]
        }
      });
    });

    if (customRules.length > 0) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        addRules: customRules
      });
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
    
    // Inject content script to perform bypass
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Force reload to apply header changes
          window.location.reload();
        }
      });
    } catch (error) {
      // Fallback to regular reload
      chrome.tabs.reload(tab.id);
    }
    
    // Add to bypassed sites for this session
    this.bypassedSites.add(domain);
  }
}

// Initialize background script
new PaywallBypassBackground();