# Installation Guide - Paywall Bypass Chrome Extension

## Quick Installation

### Step 1: Download the Extension
The extension files are ready in this directory. All necessary files are present:
- `manifest.json` - Extension configuration
- `background.js` - Service worker
- `contentScript.js` - Page manipulation script
- `sites.js` - Site configurations
- `popup.html/js` - Extension popup
- `options.html/js` - Settings page
- `icons/` - Extension icons

### Step 2: Load into Chrome

1. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Or: Menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `/app` folder (this directory)
   - The extension should now appear in your extensions list

4. **Pin the Extension**
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Paywall Bypass Extension" and click the pin icon
   - The extension icon will now appear in your toolbar

## First Use

### 1. Test Basic Functionality
- Visit a supported site like `nytimes.com` or `wsj.com`
- Click the extension icon
- The popup should show the site as "Supported"

### 2. Try Manual Bypass
- Click "Clear Cookies & Refresh" button
- The page should reload and attempt to bypass the paywall

### 3. Configure Settings
- Right-click the extension icon → Options
- Or click "Options & Settings" in the popup
- Configure your preferences

## Supported Sites (Built-in)

The extension comes pre-configured with support for 40+ major news sites:

### Major US News
- The New York Times (nytimes.com)
- The Wall Street Journal (wsj.com)
- The Washington Post (washingtonpost.com)
- Bloomberg (bloomberg.com)
- Reuters (reuters.com)

### Tech & Business
- Medium (medium.com)
- Wired (wired.com)
- The Atlantic (theatlantic.com)
- Harvard Business Review (hbr.org)

### International
- Financial Times (ft.com)
- The Telegraph (telegraph.co.uk)
- The Economist (economist.com)
- Le Monde (lemonde.fr)
- Die Zeit (zeit.de)

### And Many More!
See the full list in the Options page or README.md.

## How to Use

### Automatic Mode (Default)
1. **Just browse normally** - Visit any supported news site
2. **Extension works automatically** - Paywall bypass is attempted automatically
3. **Manual control available** - Use the popup for manual actions

### Manual Control
1. **Click extension icon** - Access the popup menu
2. **Clear cookies** - Use "Clear Cookies & Refresh" for manual bypass
3. **Add custom sites** - Use "Add Current Site" for unsupported sites

## Adding Custom Sites

1. **Visit the site** you want to add
2. **Click extension icon**
3. **Click "Add Current Site"** button
4. **Or use Options page** for bulk management

## Troubleshooting

### Extension Not Loading?
- **Check file permissions** - Ensure all files are readable
- **Verify manifest.json** - Check for JSON syntax errors
- **Try incognito mode** - Test if it works in private browsing

### Sites Not Working?
- **Clear cookies manually** - Use the extension popup
- **Disable other extensions** - Ad blockers might interfere
- **Try incognito mode** - Some sites behave differently
- **Add as custom site** - Use the manual add feature

### Performance Issues?
- **Disable on unused sites** - Remove sites you don't visit
- **Clear extension data** - Reset settings in Options
- **Restart browser** - Sometimes helps with memory issues

## Security Notes

- **Local operation only** - All data stays on your device
- **No external connections** - Extension doesn't send data anywhere
- **Open source** - All code is visible and auditable
- **Minimal permissions** - Only requests necessary permissions

## Legal Disclaimer

This extension is for **educational purposes only**. Users are responsible for:
- Complying with website terms of service
- Respecting content creators' rights
- Using the extension ethically and legally

**Consider supporting journalism** by subscribing to publications you read regularly.

## Development & Contributing

The extension is built with:
- **Manifest V3** - Latest Chrome extension standard
- **Vanilla JavaScript** - No external dependencies
- **Modern APIs** - Uses current web standards

To modify or contribute:
1. Edit the relevant files
2. Reload the extension in `chrome://extensions/`
3. Test your changes
4. Submit improvements

## Updates

To update the extension:
1. Replace files with new versions
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension
4. Or reload the unpacked extension

---

**Ready to Start!** Your Paywall Bypass Chrome Extension is now installed and ready to use. Visit any supported news site and start reading freely! 🔓📰