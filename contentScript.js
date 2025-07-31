// Content script for Paywall Bypass Extension
// Runs on web pages to detect and bypass paywalls

class PaywallBypass {
  constructor() {
    this.enabled = true;
    this.debug = true;
    this.attempts = 0;
    this.maxAttempts = 5;
    this.currentSite = null;
    this.observer = null;
    
    this.init();
  }

  async init() {
    // Wait for sites.js to load
    if (typeof window.PAYWALL_SITES === 'undefined') {
      setTimeout(() => this.init(), 100);
      return;
    }

    // Check if extension is enabled
    const response = await this.sendMessage({ action: 'getStatus' });
    this.enabled = response?.enabled !== false;

    if (!this.enabled) {
      this.log('Extension disabled');
      return;
    }

    // Check if this is a supported site
    this.currentSite = window.PAYWALL_UTILS.getCurrentSite();
    
    if (!this.currentSite) {
      this.log('Site not supported');
      return;
    }

    this.log(`Detected paywall site: ${this.currentSite.domain}`);
    
    // Start bypass process
    this.startBypass();
  }

  async startBypass() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.performBypass());
    } else {
      this.performBypass();
    }

    // Set up mutation observer for dynamic content
    this.setupObserver();
  }

  performBypass() {
    if (!this.currentSite || this.attempts >= this.maxAttempts) return;
    
    this.attempts++;
    this.log(`Bypass attempt ${this.attempts}`);

    const config = this.currentSite.config;
    
    try {
      // Method-specific bypass
      switch (config.method) {
        case 'googlebot':
          this.bypassGooglebot(config);
          break;
        case 'cookies':
          this.bypassCookies(config);
          break;
        case 'referer':
          this.bypassReferer(config);
          break;
        case 'adblock':
          this.bypassAdblock(config);
          break;
        default:
          this.bypassGeneric(config);
      }

      // Remove paywall elements
      this.removePaywallElements(config);
      
      // Unhide content
      this.unhideContent(config);
      
      // Remove scroll restrictions
      this.removeScrollRestrictions();
      
    } catch (error) {
      this.log('Bypass error:', error);
    }

    // Retry after delay if paywall still detected
    setTimeout(() => {
      if (this.detectPaywall(config)) {
        this.performBypass();
      }
    }, 2000);
  }

  bypassGooglebot(config) {
    this.log('Using Googlebot bypass');
    
    // This is handled by background script headers
    // Just clear any client-side checks
    this.clearClientChecks();
  }

  async bypassCookies(config) {
    this.log('Using cookie bypass');
    
    // Request cookie clearing from background script
    await this.sendMessage({ 
      action: 'clearCookies', 
      domain: window.location.hostname 
    });
    
    // Clear localStorage and sessionStorage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      this.log('Could not clear storage:', e);
    }
  }

  bypassReferer(config) {
    this.log('Using referer bypass');
    
    // This is handled by background script headers
    this.clearClientChecks();
  }

  bypassAdblock(config) {
    this.log('Using adblock bypass');
    
    // Block paywall scripts
    this.blockPaywallScripts();
    
    // Remove paywall elements more aggressively
    this.removePaywallElements(config, true);
  }

  bypassGeneric(config) {
    this.log('Using generic bypass');
    
    // Combination of techniques
    this.clearClientChecks();
    this.removePaywallElements(config);
    this.unhideContent(config);
  }

  removePaywallElements(config, aggressive = false) {
    if (!config.selectors?.paywall) return;

    const selectors = config.selectors.paywall.split(', ');
    let removed = 0;

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        if (aggressive) {
          el.remove();
        } else {
          el.style.display = 'none';
          el.style.visibility = 'hidden';
        }
        removed++;
      });
    });

    // Additional common paywall selectors
    const commonSelectors = [
      '[class*="paywall"]',
      '[id*="paywall"]',
      '[class*="subscription"]',
      '[class*="premium"]',
      '[class*="subscriber-only"]',
      '.modal-backdrop',
      '.overlay'
    ];

    commonSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        // Only hide large overlays that might be paywalls
        if (rect.width > 300 && rect.height > 200) {
          el.style.display = 'none';
          removed++;
        }
      });
    });

    if (removed > 0) {
      this.log(`Removed ${removed} paywall elements`);
    }
  }

  unhideContent(config) {
    if (!config.selectors?.article) return;

    const selectors = config.selectors.article.split(', ');
    let unhidden = 0;

    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        // Remove common hiding styles
        el.style.display = '';
        el.style.visibility = '';
        el.style.opacity = '';
        el.style.height = '';
        el.style.overflow = '';
        
        // Remove blur effects
        el.style.filter = '';
        el.style.webkitFilter = '';
        
        unhidden++;
      });
    });

    // Generic content unhiding
    const hiddenContent = document.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"]');
    hiddenContent.forEach(el => {
      if (el.textContent.length > 100) { // Likely article content
        el.style.display = '';
        el.style.visibility = '';
        unhidden++;
      }
    });

    if (unhidden > 0) {
      this.log(`Unhidden ${unhidden} content elements`);
    }
  }

  removeScrollRestrictions() {
    // Remove body scroll locks
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    
    // Remove event listeners that prevent scrolling
    ['scroll', 'wheel', 'touchmove'].forEach(event => {
      document.removeEventListener(event, this.preventDefault, { passive: false });
      window.removeEventListener(event, this.preventDefault, { passive: false });
    });

    this.log('Removed scroll restrictions');
  }

  preventDefault(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  clearClientChecks() {
    // Override common paywall detection methods
    if (window.localStorage) {
      // Spoof article count
      try {
        localStorage.setItem('articleCount', '0');
        localStorage.setItem('visitCount', '0');
        localStorage.setItem('freeArticlesRead', '0');
      } catch (e) {
        // Ignore storage errors
      }
    }

    // Block common paywall tracking
    this.blockPaywallScripts();
  }

  blockPaywallScripts() {
    // Block common paywall script patterns
    const scriptPatterns = [
      /paywall/i,
      /subscription/i,
      /meter/i,
      /premium/i,
      /piano\.io/i,
      /tinypass/i
    ];

    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      const src = script.src;
      if (scriptPatterns.some(pattern => pattern.test(src))) {
        script.remove();
        this.log(`Blocked script: ${src}`);
      }
    });
  }

  detectPaywall(config) {
    if (!config.selectors?.paywall) return false;

    const selectors = config.selectors.paywall.split(', ');
    return selectors.some(selector => {
      const elements = document.querySelectorAll(selector);
      return Array.from(elements).some(el => {
        const styles = window.getComputedStyle(el);
        return styles.display !== 'none' && styles.visibility !== 'hidden';
      });
    });
  }

  setupObserver() {
    // Watch for dynamically added paywall elements
    this.observer = new MutationObserver((mutations) => {
      let shouldRecheck = false;
      
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const className = node.className || '';
            const id = node.id || '';
            
            if (className.includes('paywall') || 
                className.includes('subscription') ||
                id.includes('paywall')) {
              shouldRecheck = true;
            }
          }
        });
      });

      if (shouldRecheck && this.attempts < this.maxAttempts) {
        setTimeout(() => this.performBypass(), 500);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  async sendMessage(message) {
    try {
      return await chrome.runtime.sendMessage(message);
    } catch (error) {
      this.log('Message error:', error);
      return null;
    }
  }

  log(message, ...args) {
    if (this.debug) {
      console.log(`[Paywall Bypass] ${message}`, ...args);
    }
  }
}

// Initialize when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new PaywallBypass();
  });
} else {
  new PaywallBypass();
}