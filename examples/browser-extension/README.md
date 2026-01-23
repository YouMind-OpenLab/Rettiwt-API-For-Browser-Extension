# Rettiwt API Browser Extension Demo

This is a demo browser extension that showcases the Rettiwt API running directly in a browser extension environment.

## Features

- **Login Status Check**: Automatically detects if you're logged in to X.com
- **Profile Display**: Shows your Twitter/X profile information (name, username, followers, following, tweets)
- **Bookmarks Fetch**: Fetches up to 100 of your bookmarks and displays them

## Quick Start

### Prerequisites

1. Node.js 18+ installed
2. A Chromium-based browser (Chrome, Edge, Brave, etc.)
3. Logged in to X.com in your browser

### Build Steps

1. **Install dependencies for the main library** (from the repository root):

   ```bash
   cd ../..  # Go to repository root
   npm install
   npm run build:all
   ```

2. **Install dependencies for this example**:

   ```bash
   cd examples/browser-extension
   npm install
   ```

3. **Build the extension**:

   ```bash
   npm run build
   ```

   For development with auto-rebuild:
   ```bash
   npm run watch
   ```

### Load the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `examples/browser-extension` folder (this folder)
5. The extension should now appear in your extensions list

### Using the Extension

1. Make sure you're logged in to [X.com](https://x.com) in the same browser
2. Click the extension icon in the browser toolbar
3. The popup will:
   - Check if you're logged in
   - Display your profile information
   - Allow you to fetch your bookmarks

## File Structure

```
browser-extension/
├── manifest.json          # Extension manifest (MV3)
├── popup.html             # Popup UI
├── src/
│   └── popup.ts           # Popup logic (TypeScript)
├── dist/
│   └── popup.js           # Compiled popup script
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── scripts/
│   └── generate-icons.js  # Icon generation script
├── package.json
├── tsconfig.json
├── webpack.config.js
└── README.md
```

## How It Works

The extension uses the `RettiwtBrowser` class from `rettiwt-api/browser`:

```typescript
import { RettiwtBrowser } from 'rettiwt-api/browser';

const rettiwt = new RettiwtBrowser();

// Check if logged in (just checks cookies, no API call)
if (await rettiwt.isLoggedIn()) {
  // Initialize and verify by fetching user profile
  const user = await rettiwt.initialize();
  console.log(`Logged in as: ${user.userName}`);

  // Fetch bookmarks
  const bookmarks = await rettiwt.tweet.bookmarks(20);
  console.log(`Found ${bookmarks.list.length} bookmarks`);
}
```

### Key Methods

- `isLoggedIn()`: Checks if Twitter cookies are present (no API call)
- `initialize()`: Fetches and returns the current user's profile
- `verify()`: Alias for `initialize()`
- `tweet.bookmarks(count, cursor)`: Fetches bookmarks with pagination
- `user.details(userId)`: Fetches a user's profile

## Permissions

The extension requires these permissions (defined in `manifest.json`):

- `cookies`: To read Twitter authentication cookies
- `host_permissions` for:
  - `https://*.x.com/*`
  - `https://*.twitter.com/*`
  - `https://api.twitter.com/*`
  - `https://api.x.com/*`
  - `https://upload.twitter.com/*`

## Troubleshooting

### "Not logged in to X.com"

1. Make sure you're logged in to X.com in the same browser profile
2. Try refreshing the X.com page
3. Clear the extension and reload it

### Build errors

1. Make sure you've built the main library first:
   ```bash
   cd ../..
   npm run build:all
   ```

2. Then build this example:
   ```bash
   cd examples/browser-extension
   npm install
   npm run build
   ```

### API errors

Some API calls may fail if:
- Your session has expired (re-login to X.com)
- Rate limiting (wait a few minutes)
- Twitter's API has changed (check for library updates)

## Development

### Modifying the Code

1. Edit files in `src/`
2. Run `npm run watch` for auto-rebuild
3. In Chrome, click the refresh icon on the extension card in `chrome://extensions/`
4. Click the extension icon to test changes

### Adding New Features

The `RettiwtBrowser` instance provides access to:
- `rettiwt.tweet` - Tweet operations (details, bookmarks, post, etc.)
- `rettiwt.user` - User operations (details, followers, following, etc.)
- `rettiwt.list` - List operations (details, members, etc.)
- `rettiwt.dm` - Direct message operations (inbox, etc.)

See the main library documentation for the full API reference.
