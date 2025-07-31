# Paywall Bypass Chrome Extension

A powerful Chrome extension that bypasses paywalls on popular news websites, allowing you to read articles freely.

## Features

- 🔓 **Bypass Paywalls** - Access articles from 40+ supported news sites
- 🤖 **Smart Detection** - Automatically detects and applies appropriate bypass methods
- 🍪 **Cookie Management** - Clears cookies to reset article limits
- 🕷️ **User Agent Spoofing** - Appears as search engine crawler when needed
- ⚙️ **Custom Sites** - Add your own sites with custom bypass rules
- 🎯 **Selective Bypass** - Enable/disable per site or globally
- 🚀 **Fast & Lightweight** - Minimal impact on browsing performance

## Supported Sites

### Major News Outlets
- The New York Times
- The Wall Street Journal  
- The Washington Post
- The Economist
- Financial Times
- Bloomberg
- Reuters

### Tech & Business
- Medium
- Wired
- The Atlantic
- The New Yorker
- Harvard Business Review
- MIT Technology Review

### International
- The Telegraph (UK)
- The Guardian (UK)
- Le Monde (France)
- Le Figaro (France)
- Die Zeit (Germany)

### And Many More!
The extension supports 40+ sites out of the box and allows you to add custom sites.

## Installation

Since this extension is not available on the Chrome Web Store, you need to install it manually:

### Method 1: Load Unpacked (Recommended)

1. **Download or Clone** this repository to your computer
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by toggling the switch in the top right
4. **Click "Load unpacked"** and select the folder containing the extension files
5. **Pin the extension** to your toolbar for easy access

### Method 2: CRX File (If Available)

1. Download the `.crx` file from releases
2. Open Chrome and go to `chrome://extensions/`
3. Enable Developer Mode
4. Drag the `.crx` file onto the extensions page

## Usage

### Basic Usage
1. **Browse normally** - Visit any supported news site
2. **Automatic bypass** - The extension will automatically attempt to bypass paywalls
3. **Manual control** - Click the extension icon for manual controls

### Extension Popup
Click the extension icon to access:
- **Toggle on/off** - Enable or disable the extension
- **Clear cookies** - Manually clear cookies and refresh the page
- **Add custom site** - Add the current site to your custom list
- **Open settings** - Access the full options page

### Options Page
Right-click the extension icon and select "Options" or click "Options & Settings" in the popup to access:
- **General settings** - Configure automatic behaviors
- **Custom sites** - Manage your custom site list
- **Statistics** - View usage statistics
- **Supported sites** - See all built-in supported sites

## How It Works

The extension uses several techniques to bypass paywalls:

### 1. User Agent Spoofing
- Presents itself as Google's web crawler (Googlebot)
- Many sites allow free access to search engine crawlers

### 2. Cookie Clearing
- Removes tracking cookies that count article views
- Resets "free article" counters on metered paywalls

### 3. Referer Manipulation
- Makes requests appear to come from Google or social media
- Some sites allow free access from these sources

### 4. JavaScript Blocking
- Blocks scripts that implement paywall functionality
- Prevents dynamic paywall overlays from loading

### 5. DOM Manipulation
- Removes paywall overlays and restrictions
- Unhides article content that may be hidden

## Technical Details

### Architecture
- **Manifest V3** - Uses the latest Chrome extension API
- **Service Worker** - Background script handles requests and storage
- **Content Scripts** - Injected into web pages to manipulate content
- **Storage API** - Saves settings and custom sites across browser sessions

### Files Structure
```
/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (background script)
├── contentScript.js       # Content script for page manipulation
├── sites.js              # Site configurations and rules
├── popup.html/js         # Extension popup interface
├── options.html/js       # Options/settings page
├── icons/                # Extension icons
└── README.md            # This file
```

### Permissions
The extension requests these permissions:
- **activeTab** - Access to current tab for bypass functionality
- **storage** - Save settings and custom sites
- **cookies** - Clear cookies for bypass
- **webRequest** - Modify request headers
- **scripting** - Inject content scripts

## Privacy & Security

- **No data collection** - The extension doesn't collect or transmit any personal data
- **Local storage only** - All settings and data are stored locally on your device
- **Open source** - Full source code is available for review
- **Minimal permissions** - Only requests necessary permissions for functionality

## Troubleshooting

### Extension Not Working?
1. **Check if enabled** - Click the extension icon to verify it's enabled
2. **Refresh the page** - Sometimes a page refresh is needed after enabling
3. **Clear cookies manually** - Use the "Clear Cookies & Refresh" button
4. **Check site support** - Verify the site is in the supported list
5. **Disable other extensions** - Ad blockers might interfere

### Site Still Showing Paywall?
1. **Try incognito mode** - Open the site in a private/incognito window
2. **Add as custom site** - Use the "Add Current Site" button
3. **Clear all cookies** - Clear all cookies for the site manually
4. **Disable JavaScript temporarily** - Some sites require JavaScript to be disabled

### Performance Issues?
1. **Disable on unnecessary sites** - Turn off the extension for sites you don't need it on
2. **Clear custom sites** - Remove sites that don't work from your custom list
3. **Restart browser** - Sometimes a browser restart helps with memory issues

## Contributing

Contributions are welcome! Here's how you can help:

### Adding New Sites
1. Test the site with existing bypass methods
2. Add site configuration to `sites.js`
3. Test thoroughly across different articles
4. Submit a pull request with your changes

### Reporting Issues
1. Check existing issues first
2. Include browser version and extension version
3. Provide the specific site URL that's not working
4. Describe the expected vs actual behavior

### Development
1. Fork the repository
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Legal Disclaimer

This extension is provided for educational and research purposes only. Users are responsible for complying with the terms of service of the websites they visit. The developers do not encourage or condone the violation of paywalls or terms of service.

**Use responsibly:**
- Consider supporting journalism by subscribing to publications you read regularly
- Respect content creators and their business models
- Use this tool ethically and in accordance with applicable laws

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the original Bypass Paywalls Clean project
- Thanks to all contributors who help maintain site compatibility
- Special thanks to the open source community for testing and feedback

---

**⚠️ Important Note:** This extension is not affiliated with or endorsed by any news organization. It is an independent project created for educational purposes.