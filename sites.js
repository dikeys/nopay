// Site configurations for paywall bypass
// Contains rules and methods for different news sites

window.PAYWALL_SITES = {
  // Major US News
  'nytimes.com': {
    method: 'googlebot',
    selectors: {
      paywall: '.subscriptions-banner, .expanded-dock, .bottom-of-article, .css-1s5me5j',
      article: '.StoryBodyCompanionColumn, .ArticleBody'
    },
    clearCookies: true,
    userAgent: 'Googlebot'
  },
  
  'wsj.com': {
    method: 'googlebot',
    selectors: {
      paywall: '.snippet-promotion, .wsj-snippet-login',
      article: '.article-content, .article-body'
    },
    clearCookies: true,
    userAgent: 'Googlebot'
  },
  
  'washingtonpost.com': {
    method: 'googlebot', 
    selectors: {
      paywall: '.paywall, .subscribe-slug',
      article: '.article-body'
    },
    clearCookies: true,
    userAgent: 'Googlebot'
  },
  
  'bloomberg.com': {
    method: 'referer',
    selectors: {
      paywall: '.paywall, .fence-body',
      article: '.body-content'
    },
    referer: 'https://www.google.com/',
    clearCookies: true
  },
  
  'economist.com': {
    method: 'googlebot',
    selectors: {
      paywall: '.subscription-required, .paywall',
      article: '.article__body-text'
    },
    clearCookies: true,
    userAgent: 'Googlebot'
  },
  
  // UK News
  'ft.com': {
    method: 'googlebot',
    selectors: {
      paywall: '.subscription-prompt, .barrier-body',
      article: '.article__content-body'
    },
    clearCookies: true,
    userAgent: 'Googlebot'
  },
  
  'telegraph.co.uk': {
    method: 'googlebot',
    selectors: {
      paywall: '.premium-paywall, .paywall-prompt',
      article: '.article-body-text'
    },
    clearCookies: true,
    userAgent: 'Googlebot'
  },
  
  'independent.co.uk': {
    method: 'adblock',
    selectors: {
      paywall: '.paywall, .subscription-banner',
      article: '.article-body'
    },
    clearCookies: true
  },
  
  // Tech & Business
  'medium.com': {
    method: 'googlebot',
    selectors: {
      paywall: '.paywall, .memberPaywallInlineContent',
      article: '.postArticle-content'
    },
    clearCookies: true,
    userAgent: 'Googlebot'
  },
  
  'wired.com': {
    method: 'googlebot',
    selectors: {
      paywall: '.paywall-bar, .paywall',
      article: '.article__chunks'
    },
    clearCookies: true,
    userAgent: 'Googlebot'
  },
  
  'newyorker.com': {
    method: 'googlebot',
    selectors: {
      paywall: '.paywall, .subscription-bar',
      article: '.SplitScreenContentHeaderPadding'
    },
    clearCookies: true,
    userAgent: 'Googlebot'
  },
  
  'theatlantic.com': {
    method: 'googlebot',
    selectors: {
      paywall: '.c-article-gated-paywall, .paywall',
      article: '.c-article-body'
    },
    clearCookies: true,
    userAgent: 'Googlebot'
  },
  
  'substack.com': {
    method: 'cookies',
    selectors: {
      paywall: '.paywall-bar, .paywall-full-content'
    },
    clearCookies: true
  },
  
  // French News
  'lemonde.fr': {
    method: 'googlebot',
    selectors: {
      paywall: '.paywall, .article__status-premium',
      article: '.article__content'
    },
    clearCookies: true,
    userAgent: 'Googlebot'
  },
  
  'lefigaro.fr': {
    method: 'googlebot', 
    selectors: {
      paywall: '.paywall, .fig-premium-paywall',
      article: '.fig-content-body'
    },
    clearCookies: true,
    userAgent: 'Googlebot'
  },
  
  // German News
  'bild.de': {
    method: 'cookies',
    selectors: {
      paywall: '.paywall-overlay, .vjs-modal-dialog',
      article: '.txt'
    },
    clearCookies: true
  },
  
  'zeit.de': {
    method: 'googlebot',
    selectors: {
      paywall: '.gate, .paywall',
      article: '.paragraph'
    },
    clearCookies: true,
    userAgent: 'Googlebot'
  }
};

// Helper functions for site detection
window.PAYWALL_UTILS = {
  getCurrentSite() {
    const hostname = window.location.hostname.toLowerCase();
    
    // Find matching site configuration
    for (const [domain, config] of Object.entries(window.PAYWALL_SITES)) {
      if (hostname.includes(domain)) {
        return { domain, config };
      }
    }
    
    return null;
  },
  
  isPaywallSite() {
    return this.getCurrentSite() !== null;
  },
  
  getSiteConfig(domain = null) {
    if (!domain) {
      const site = this.getCurrentSite();
      return site ? site.config : null;
    }
    
    for (const [siteDomain, config] of Object.entries(window.PAYWALL_SITES)) {
      if (domain.includes(siteDomain)) {
        return config;
      }
    }
    
    return null;
  }
};