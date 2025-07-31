// Demo script to test extension functionality
// This would run in the browser console to test the extension

console.log('🔓 Paywall Bypass Extension - Demo Test');

// Test 1: Check if extension is loaded
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('✅ Chrome extension API available');
} else {
  console.log('❌ Chrome extension API not available');
}

// Test 2: Check if sites.js is loaded
if (typeof window.PAYWALL_SITES !== 'undefined') {
  console.log('✅ Sites configuration loaded');
  console.log(`📊 Supported sites: ${Object.keys(window.PAYWALL_SITES).length}`);
} else {
  console.log('❌ Sites configuration not loaded');
}

// Test 3: Check current site support
if (typeof window.PAYWALL_UTILS !== 'undefined') {
  const currentSite = window.PAYWALL_UTILS.getCurrentSite();
  if (currentSite) {
    console.log(`✅ Current site supported: ${currentSite.domain}`);
    console.log(`🔧 Bypass method: ${currentSite.config.method}`);
  } else {
    console.log('ℹ️ Current site not in supported list');
  }
} else {
  console.log('❌ Paywall utilities not loaded');
}

// Test 4: List all supported sites
if (typeof window.PAYWALL_SITES !== 'undefined') {
  console.log('📋 All supported sites:');
  Object.keys(window.PAYWALL_SITES).forEach((site, index) => {
    console.log(`  ${index + 1}. ${site}`);
  });
}

console.log('🎯 Demo complete! Extension is ready for use.');