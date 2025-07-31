// Background script for Paywall Bypass Extension (Manifest V3)
// Service worker for handling cookies, storage, and extension logic

class PaywallBypassBackground {
  constructor() {
    this.enabled = true;
    this.customSites = new Set();
    this.init();
  }

  init() {
    console.log('Paywall Bypass Extension: Service worker starting...');
    
    // Initialize extension on install
    chrome.runtime.onInstalled.addListener(async (details) => {
      console.log('Extension installed/updated');
      await this.loadSettings();
      await this.setupContextMenu();
    });

    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep channel open for async response
    });

    // Load settings on startup
    this.loadSettings();
  }

  async setupContextMenu() {
    try {
      // Remove existing menu items first
      await chrome.contextMenus.removeAll();
      
      // Create context menu
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
    } catch (error) {
      console.log('Context menu setup error (this is normal):', error.message);
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['enabled', 'customSites']);
      this.enabled = result.enabled !== false; // Default to true
      this.customSites = new Set(result.customSites || []);
      console.log('Settings loaded:', { enabled: this.enabled, customSites: this.customSites.size });
    } catch (error) {
      console.log('Settings loaded with defaults');
      this.enabled = true;
      this.customSites = new Set();
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.sync.set({
        enabled: this.enabled,
        customSites: Array.from(this.customSites)
      });
      console.log('Settings saved');
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  shouldBypass(domain) {
    // Check against supported sites list
    const supportedSites = [
      'nytimes.com', 'wsj.com', 'washingtonpost.com', 'economist.com',
      'ft.com', 'bloomberg.com', 'reuters.com', 'apnews.com',
      'latimes.com', 'bostonglobe.com', 'lemonde.fr', 'lefigaro.fr',
      'telegraph.co.uk', 'theguardian.com', 'independent.co.uk',
      'medium.com', 'substack.com', 'wired.com', 'newyorker.com',
      'theatlantic.com', 'harpers.org', 'nationalreview.com',
      'slate.com', 'vox.com', 'politico.com', 'axios.com'
    ];

    return supportedSites.some(site => domain.includes(site)) || 
           this.customSites.has(domain);
  }

  async handleMessage(message, sender, sendResponse) {
    console.log('Received message:', message.action);
    
    try {
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
          const success = await this.clearSiteCookies(message.domain);
          sendResponse({ success });
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
          
        case 'updateSettings':
          if (message.settings) {
            this.enabled = message.settings.enabled !== false;
            await this.saveSettings();
          }
          sendResponse({ success: true });
          break;
          
        default:
          sendResponse({ error: 'Unknown action: ' + message.action });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  async clearSiteCookies(domain) {
    try {
      console.log('Clearing cookies for domain:', domain);
      
      // Get all cookies for the domain
      const cookies = await chrome.cookies.getAll({ domain });
      console.log(`Found ${cookies.length} cookies for ${domain}`);
      
      // Remove each cookie
      for (const cookie of cookies) {
        const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
        await chrome.cookies.remove({
          url: url,
          name: cookie.name
        });
      }
      
      // Also try without the leading dot
      if (domain.startsWith('.')) {
        const cleanDomain = domain.substring(1);
        const moreCookies = await chrome.cookies.getAll({ domain: cleanDomain });
        for (const cookie of moreCookies) {
          const url = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
          await chrome.cookies.remove({
            url: url,
            name: cookie.name
          });
        }
      }
      
      console.log(`Cleared cookies for ${domain}`);
      return true;
    } catch (error) {
      console.error('Error clearing cookies:', error);
      return false;
    }
  }

  async bypassCurrentSite(tab) {
    if (!tab || !tab.url) {
      console.log('No valid tab provided');
      return;
    }
    
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;
      
      console.log('Bypassing site:', domain);
      
      // Clear cookies
      await this.clearSiteCookies(domain);
      
      // Clear storage via content script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          try {
            localStorage.clear();
            sessionStorage.clear();
            console.log('Cleared localStorage and sessionStorage');
          } catch (e) {
            console.log('Could not clear storage:', e);
          }
        }
      });
      
      // Reload the page
      await chrome.tabs.reload(tab.id);
      
      console.log('Site bypass completed for:', domain);
      
    } catch (error) {
      console.error('Error bypassing site:', error);
    }
  }
}

// Initialize the background script
console.log('Initializing Paywall Bypass Background Script...');
const paywallBypass = new PaywallBypassBackground();