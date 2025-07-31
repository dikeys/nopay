// Content script for Paywall Bypass Extension
// Runs on web pages to detect and bypass paywalls

class PaywallBypass {
  constructor() {
    this.enabled = true;
    this.debug = true;
    this.attempts = 0;
    this.maxAttempts = 3;
    this.currentSite = null;
    this.observer = null;
    
    this.init();
  }

  async init() {
    // Wait for sites.js to load
    let retries = 0;
    while (typeof window.PAYWALL_SITES === 'undefined' && retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    
    if (typeof window.PAYWALL_SITES === 'undefined') {
      this.log('Sites configuration not loaded, using fallback');
      // Continue with basic functionality
    }

    // Check if extension is enabled
    try {
      const response = await this.sendMessage({ action: 'getStatus' });
      this.enabled = response?.enabled !== false;
    } catch (error) {
      this.log('Could not get extension status, assuming enabled');
      this.enabled = true;
    }

    if (!this.enabled) {
      this.log('Extension disabled');
      return;
    }

    // Check if this is a supported site
    this.currentSite = this.getCurrentSite();
    
    if (!this.currentSite) {
      this.log('Site not supported');
      return;
    }

    this.log(`Detected paywall site: ${this.currentSite.domain}`);
    
    // Start bypass process
    this.startBypass();
  }

  getCurrentSite() {
    const hostname = window.location.hostname.toLowerCase();
    
    // Check against known sites
    if (typeof window.PAYWALL_SITES !== 'undefined' && window.PAYWALL_UTILS) {
      return window.PAYWALL_UTILS.getCurrentSite();
    }
    
    // Fallback list of supported sites
    const supportedSites = [
      'nytimes.com', 'wsj.com', 'washingtonpost.com', 'economist.com',
      'ft.com', 'bloomberg.com', 'reuters.com', 'medium.com',
      'telegraph.co.uk', 'wired.com', 'newyorker.com', 'theatlantic.com'
    ];
    
    for (const site of supportedSites) {
      if (hostname.includes(site)) {
        return {
          domain: site,
          config: {
            method: 'generic',
            selectors: {
              paywall: '[class*="paywall"], [id*="paywall"], [class*="subscription"], [class*="premium"]',
              article: 'article, .article, [class*="content"], [class*="body"]'
            },
            clearCookies: true
          }
        };
      }
    }
    
    return null;
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
        case 'generic':
        default:
          this.bypassGeneric(config);
      }

      // Remove paywall elements
      this.removePaywallElements(config);
      
      // Unhide content
      this.unhideContent(config);
      
      // Remove scroll restrictions
      this.removeScrollRestrictions();
      
      // Clear client-side restrictions  
      this.clearClientChecks();
      
    } catch (error) {
      this.log('Bypass error:', error);
    }

    // Retry after delay if paywall still detected
    setTimeout(() => {
      if (this.detectPaywall(config) && this.attempts < this.maxAttempts) {
        this.performBypass();
      }
    }, 2000);
  }

  bypassGeneric(config) {
    this.log('Using generic bypass');
    
    // Clear client checks
    this.clearClientChecks();
    
    // Remove paywall elements
    this.removePaywallElements(config, false);
    
    // Unhide content
    this.unhideContent(config);
  }

  removePaywallElements(config, aggressive = false) {
    let removed = 0;
    
    // Use configured selectors if available
    if (config.selectors?.paywall) {
      const selectors = config.selectors.paywall.split(', ');
      selectors.forEach(selector => {
        try {
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
        } catch (e) {
          // Ignore invalid selectors
        }
      });
    }

    // Additional common paywall selectors
    const commonSelectors = [
      '[class*="paywall"]',
      '[id*="paywall"]',
      '[class*="subscription"]',
      '[class*="premium"]',
      '[class*="subscriber-only"]',
      '[class*="modal"]',
      '[class*="overlay"]',
      '.tp-modal', '.tp-backdrop', // TinyPass/Piano
      '[data-testid*="paywall"]'
    ];

    commonSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          // Only hide large overlays that might be paywalls
          if (rect.width > 200 && rect.height > 100) {
            el.style.display = 'none';
            removed++;
          }
        });
      } catch (e) {
        // Ignore invalid selectors
      }
    });

    if (removed > 0) {
      this.log(`Removed ${removed} paywall elements`);
    }
  }

  unhideContent(config) {
    let unhidden = 0;

    // Use configured selectors if available
    if (config.selectors?.article) {
      const selectors = config.selectors.article.split(', ');
      selectors.forEach(selector => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            this.unhideElement(el);
            unhidden++;
          });
        } catch (e) {
          // Ignore invalid selectors
        }
      });
    }

    // Generic content unhiding
    const hiddenContent = document.querySelectorAll(
      '[style*="display: none"], [style*="visibility: hidden"], [style*="opacity: 0"]'
    );
    
    hiddenContent.forEach(el => {
      if (el.textContent && el.textContent.length > 100) { // Likely article content
        this.unhideElement(el);
        unhidden++;
      }
    });

    if (unhidden > 0) {
      this.log(`Unhidden ${unhidden} content elements`);
    }
  }

  unhideElement(el) {
    // Remove common hiding styles
    el.style.display = '';
    el.style.visibility = '';
    el.style.opacity = '';
    el.style.height = '';
    el.style.maxHeight = '';
    el.style.overflow = '';
    
    // Remove blur effects
    el.style.filter = '';
    el.style.webkitFilter = '';
    
    // Remove classes that might hide content
    const hidingClasses = ['hidden', 'hide', 'blur', 'fade'];
    hidingClasses.forEach(cls => {
      if (el.classList.contains(cls)) {
        el.classList.remove(cls);
      }
    });
  }

  removeScrollRestrictions() {
    // Remove body scroll locks
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.style.position = '';
    document.documentElement.style.position = '';
    
    // Remove common scroll-blocking classes
    const scrollBlockingClasses = ['no-scroll', 'scroll-lock', 'modal-open'];
    scrollBlockingClasses.forEach(cls => {
      document.body.classList.remove(cls);
      document.documentElement.classList.remove(cls);
    });

    this.log('Removed scroll restrictions');
  }

  clearClientChecks() {
    // Override common paywall detection methods
    if (window.localStorage) {
      try {
        localStorage.setItem('articleCount', '0');
        localStorage.setItem('visitCount', '0');
        localStorage.setItem('freeArticlesRead', '0');
        localStorage.removeItem('paywall');
        localStorage.removeItem('subscription');
      } catch (e) {
        // Ignore storage errors
      }
    }

    // Block common paywall script patterns
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
      try {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements).some(el => {
          const styles = window.getComputedStyle(el);
          return styles.display !== 'none' && styles.visibility !== 'hidden';
        });
      } catch (e) {
        return false;
      }
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

    if (document.body) {
      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
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