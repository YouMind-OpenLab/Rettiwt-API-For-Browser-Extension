# @youmind-openlab/rettiwt-api

YouMind Open Lab fork - An API for fetching data from Twitter/X, **with browser extension support!**

This is a fork of [Rettiwt-API](https://github.com/Rishikant181/Rettiwt-API) that adds browser extension compatibility. You can now use this library directly in browser extensions without needing to pass API keys - it automatically retrieves authentication from browser cookies.

## What's New in This Fork

- 🌐 **Browser Extension Support** - Use directly in Chrome/Firefox extensions
- 🔐 **Automatic Cookie Authentication** - No need to manually extract API keys
- 📦 **Separate Browser Entry Point** - Import from `@youmind-openlab/rettiwt-api/browser`
- ✨ **Zero Configuration** - Just `new RettiwtBrowser()` and you're ready to go

## Installation

```bash
npm install @youmind-openlab/rettiwt-api
```

## Quick Start

### For Browser Extensions

```typescript
import { RettiwtBrowser } from '@youmind-openlab/rettiwt-api/browser';

const rettiwt = new RettiwtBrowser();

// Check if user is logged in to X.com
if (await rettiwt.isLoggedIn()) {
  // Initialize and verify authentication
  const user = await rettiwt.initialize();
  console.log(`Logged in as: ${user.userName}`);

  // Fetch bookmarks
  const bookmarks = await rettiwt.user.bookmarks(20);
  console.log(`Found ${bookmarks.list.length} bookmarks`);

  // Search tweets
  const results = await rettiwt.tweet.search({ includeWords: ['javascript'] }, 20);
  console.log(`Found ${results.list.length} tweets`);
}
```

### For Node.js (Original Usage)

```typescript
import { Rettiwt } from '@youmind-openlab/rettiwt-api';

// Guest authentication (limited access)
const rettiwt = new Rettiwt();

// User authentication (full access)
const rettiwt = new Rettiwt({ apiKey: 'YOUR_API_KEY' });

// Fetch user details
const user = await rettiwt.user.details('elonmusk');
console.log(user);
```

## Browser Extension Usage

### Prerequisites

Your browser extension needs the following permissions in `manifest.json`:

```json
{
  "manifest_version": 3,
  "permissions": ["cookies"],
  "host_permissions": [
    "https://*.x.com/*",
    "https://*.twitter.com/*"
  ]
}
```

### RettiwtBrowser API

#### `isLoggedIn(): Promise<boolean>`

Checks if the user is logged in to X.com by checking for required cookies. **Does NOT make any API calls.**

```typescript
const rettiwt = new RettiwtBrowser();
if (await rettiwt.isLoggedIn()) {
  // User is logged in
}
```

#### `initialize(): Promise<User>`

Initializes the library and verifies authentication. Must be called before using other methods.

```typescript
const rettiwt = new RettiwtBrowser();
const user = await rettiwt.initialize();
console.log(`Welcome, ${user.fullName}!`);
```

#### Available Services

After initialization, you can access:

- `rettiwt.user` - User-related operations (bookmarks, followers, following, etc.)
- `rettiwt.tweet` - Tweet-related operations (search, details, like, retweet, etc.)
- `rettiwt.list` - List-related operations
- `rettiwt.dm` - Direct message operations

### Example: Fetching Bookmarks with Pagination

```typescript
import { RettiwtBrowser, Tweet } from '@youmind-openlab/rettiwt-api/browser';

const rettiwt = new RettiwtBrowser();
await rettiwt.initialize();

const allBookmarks: Tweet[] = [];
let cursor: string | undefined;

do {
  const result = await rettiwt.user.bookmarks(20, cursor);
  allBookmarks.push(...result.list);
  cursor = result.next || undefined;
} while (cursor);

console.log(`Total bookmarks: ${allBookmarks.length}`);
```

### Example: Searching Tweets

```typescript
const results = await rettiwt.tweet.search({
  includeWords: ['typescript', 'react'],
  fromUsers: ['dan_abramov'],
  minLikes: 100
}, 20);

for (const tweet of results.list) {
  console.log(`@${tweet.tweetBy?.userName}: ${tweet.fullText}`);
}
```

### Configuration Options

```typescript
const rettiwt = new RettiwtBrowser({
  timeout: 30000,      // Request timeout in ms
  logging: true,       // Enable debug logging
  maxRetries: 5,       // Retries on 404 errors (default: 5)
  delay: 1000,         // Delay between requests in ms
});
```

## Building Your Own Extension

### 1. Set up webpack for browser bundling

```javascript
// webpack.config.js
const webpack = require('webpack');

module.exports = {
  entry: './src/popup.ts',
  output: {
    filename: 'popup.js',
    path: __dirname + '/dist',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      fs: false,
      path: false,
      crypto: false,
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
    },
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
  module: {
    rules: [
      { test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ },
    ],
  },
};
```

### 2. Install browser polyfills

```bash
npm install --save-dev buffer stream-browserify
```

### 3. Create your extension popup

```typescript
// popup.ts
import { RettiwtBrowser } from '@youmind-openlab/rettiwt-api/browser';

async function main() {
  const rettiwt = new RettiwtBrowser();

  if (!(await rettiwt.isLoggedIn())) {
    document.body.innerHTML = '<p>Please log in to X.com first</p>';
    return;
  }

  const user = await rettiwt.initialize();
  document.body.innerHTML = `<p>Welcome, ${user.fullName}!</p>`;
}

main();
```

## Exported Types

The browser entry point exports the following:

```typescript
import {
  RettiwtBrowser,        // Main browser class
  User,                  // User data type
  Tweet,                 // Tweet data type
  CursoredData,          // Paginated response type
  // ... and more
} from '@youmind-openlab/rettiwt-api/browser';
```

---

# Original Rettiwt-API Documentation

The sections below are from the original Rettiwt-API documentation for Node.js usage.

## Prerequisites

- NodeJS 22
- A working Twitter account (optional)

## Installation (CLI)

It is recommended to install the package globally, if you want to use it from the CLI. Use the following steps to install the package and ensure it's installed correctly:

1. Open a terminal.
2. Install the package using the command `npm install -g @youmind-openlab/rettiwt-api`.
3. Check if the package is installed correctly using the command `rettiwt help`.

For using the package in your own project, you can install it as a [dependency](https://rishikant181.github.io/Rettiwt-API/#md:usage-as-a-dependency).

## Authentication

Rettiwt-API can be used with or without logging in to Twitter. As such, the two authentication strategies are:

- 'Guest' authentication (without logging in) grants access to the following resources/actions:

    - Tweet Details
    - User Details (by username)
    - User Timeline

- 'User' authentication (logging in) grants access to the following resources/actions:

    - Direct Message Inbox
    - Direct Message Conversations
    - Direct Message Delete Conversation
    - List Add Member
    - List Details
    - List Members
    - List Remove Member
    - List Tweets
    - Tweet Details - Single and Bulk
    - Tweet Bookmark
    - Tweet Like
    - Tweet Likers
    - Tweet Media Upload
    - Tweet Post
    - Tweet Replies
    - Tweet Retweet
    - Tweet Retweeters
    - Tweet Schedule
    - Tweet Search
    - Tweet Stream
    - Tweet Unbookmark
    - Tweet Unlike
    - Tweet Unpost
    - Tweet Unretweet
    - Tweet Unschedule
    - User Affiliates
    - User Analytics (Only for Premium accounts)
    - User Bookmarks
    - User Bookmark Folders
    - User Bookmark Folder Tweets
    - User Details - Single (by ID and Username) and Bulk (by ID only)
    - User Follow
    - User Followed Feed
    - User Followers
    - User Following
    - User Highlights
    - User Likes
    - User Lists
    - User Media
    - User Notification
    - User Recommended Feed
    - User Replies Timeline
    - User Search
    - User Subscriptions
    - User Timeline
    - User Unfollow
    - User Profile Update

By default, Rettiwt-API uses 'guest' authentication. If however, access to the full set of resources is required, 'user' authentication can be used. This is done by using the cookies associated with your Twitter/X account, and encoding them into an `API_KEY` for convenience. The said `API_KEY` can be obtained by using a browser extension, as follows:

### A. For Chrome/Chromium-based browsers:

1. Install the [X Auth Helper extension](https://chromewebstore.google.com/detail/x-auth-helper/igpkhkjmpdecacocghpgkghdcmcmpfhp) from the Chrome Web Store, and allow it to run it in incognito mode.
2. Switch to incognito mode and login to Twitter/X.
3. After successful login, while still being on Twitter/X, click on the extension which will open the extension popup.
4. Click on the `Get Key` button, this will generate the `API_KEY` and will show up in the text-area.
5. Copy the `API_KEY` by either clicking on the `Copy Key` button or manually from the text-area.
6. You may close the browser, but don't log out. Remember, since it's incognito mode, you didn't explicity 'log out', so, while the session will be erased from the browser, the `API_KEY` still remains valid.
7. Save the `API_KEY` for use.

### B. For Firefox/Firefox-based browsers:

1. Install the [Rettiwt Auth Helper extension](https://addons.mozilla.org/en-US/firefox/addon/rettiwt-auth-helper) from Firefox Add-Ons, and allow it to run it in in-private mode.
2. Switch to in-private mode and login to Twitter/X.
3. After successful login, while still being on Twitter/X, click on the extension which will open the extension popup.
4. Click on the `Get API Key` button, this will generate the `API_KEY` and will show up in the text-area.
5. Copy the `API_KEY` by either clicking on the `Copy API Key` button or manually from the text-area.
6. You may close the browser, but don't log out. Remember, since it's in-private mode, you didn't explicity 'log out', so, while the session will be erased from the browser, the `API_KEY` still remains valid.
7. Save the `API_KEY` for use.

#### Notes:

- `API_KEY` created in this way should last 5 years from the date of login, as long as the credentials to the account aren't changed.
- This approach can also be done without going into incognito/in-private mode, in which case you can either login as usual or skip the login step if you're already logged in, and continue from the steps after login. However, this makes the `API_KEY` to last only as long as the Twitter/X account isn't logged out of (you may exit the browser as usual) or 5 years, whichever comes first. That's why it's recommended to use incognito/in-private mode, so that the `API_KEY` isn't accidentially revoked by logging out.

## The API_KEY

The API_KEY generated by logging in is what allows Rettiwt-API to authenticate as a logged in user while interacting with the Twitter API ('user' authentication). As such it is a very sensitive information and therefore, must be stored securely. The following points must be kept in mind while using the API_KEY for 'user' authentication:

- The API_KEY is actually a base64 encoding of the account's cookies.
- The API_KEY provides the same level of authorization as any standard Twitter account, nothing more, nothing less.

## Usage as a dependency

Rettiwt-API can be used as a dependency for your NodeJS project. In such a case, it is not required to install Rettiwt-API globally and you may install it locally in the root of your project using the command:

- `npm install --save @youmind-openlab/rettiwt-api` (using npm)

    or

- `yarn add @youmind-openlab/rettiwt-api` (using yarn)

However, in this case, for accessing the CLI, you will be required to prepend the CLI commands with `npx` in order to tell NodeJS to use the locally installed package.

## The Rettiwt class

When used as a dependency, the [Rettiwt](https://rishikant181.github.io/Rettiwt-API/classes/Rettiwt.html) class is entry point for accessing the Twitter API.

A new Rettiwt instance can be initialized using the following code snippets:

- `const rettiwt = new Rettiwt()` (for 'guest' authentication)
- `const rettiwt = new Rettiwt({ apiKey: API_KEY })` (for 'user' authentication)

The Rettiwt class has four members:

- `dm` member, for accessing resources related to direct messages.
- `list` member, for accessing resources related to lists.
- `tweet` member, for accessing resources related to tweets.
- `user` member, for accessing resources related to users.

For details regarding usage of these members for accessing the Twitter API, refer to [features](https://rishikant181.github.io/Rettiwt-API/#md:features).

## Rettiwt Configuration

When initializing a new Rettiwt instance, it can be configures using various parameters, namely:

- `apiKey` (string) - The API key to use for `user` authentication.
- `proxyUrl` (URL) - The URL to the proxy server to use.
- `timeout` (number) - The timeout to use for HTTP requests used by Rettiwt.
- `logging` (boolean) - Whether to enable logging or not.
- `errorHandler` (interface) - The custom error handler to use.
- `tidProvider` (interface) - The custom TID provider to use for generating transaction token.
- `headers` (object) - Custom HTTP headers to append to the default headers.
- `delay` (number/function) - The delay to use between concurrent requests, can either be a number in milliseconds, or a function that returns the number. Default is 0 (no delay).
- `maxRetries` (number) - The maximum number of retries to use in case when a random error 404 is encountered. Default is 0 (no retries).

Of these parameters, the following are hot-swappable, using their respective setters:

- `apiKey`
- `headers`
- `proxyUrl`

## Usage Examples

### 1. Getting the details of a target Twitter user

```ts
import { Rettiwt } from '@youmind-openlab/rettiwt-api';

// Creating a new Rettiwt instance
// Note that for accessing user details, 'guest' authentication can be used
const rettiwt = new Rettiwt();

// Fetching the details of the user whose username is <username>
rettiwt.user.details('<username>')
.then(details => {
	console.log(details);
})
.catch(error => {
	console.error(error);
});
```

### 2. Getting the list of tweets that match a given filter

```ts
import { Rettiwt } from '@youmind-openlab/rettiwt-api';

// Creating a new Rettiwt instance using the API_KEY
const rettiwt = new Rettiwt({ apiKey: API_KEY });

/**
 * Fetching the list of tweets that:
 * 	- are made by a user with username <username>,
 * 	- contain the words <word1> and <word2>
 */
rettiwt.tweet.search({
	fromUsers: ['<username>'],
	includeWords: ['<word1>', '<word2>']
})
.then(data => {
	console.log(data);
})
.catch(err => {
	console.error(err);
});
```

For more information regarding the different available filter options, please refer to [TweetFilter](https://rishikant181.github.io/Rettiwt-API/classes/TweetFilter.html).

### 3. Getting the next batch of data using a cursor

```ts
import { Rettiwt } from '@youmind-openlab/rettiwt-api';

// Creating a new Rettiwt instance using the API_KEY
const rettiwt = new Rettiwt({ apiKey: API_KEY });

/**
 * Fetching the list of tweets that:
 * 	- are made by a user with username <username>,
 * 	- contain the words <word1> and <word2>
 *
 * 'data' is the response object received in the previous example.
 *
 * 'count' is a number less or equal to 20 (the quantity of tweets to return)
 */
rettiwt.tweet.search({
	fromUsers: ['<username>'],
	includeWords: ['<word1>', '<word2>']
}, count, data.next.value)
.then(data => {
	console.log(data);
})
.catch(err => {
	console.error(err);
});
```

## Using a proxy

For masking of IP address using a proxy server, use the following code snippet for instantiation of Rettiwt:

```ts
/**
 * PROXY_URL is the URL or configuration for the proxy server you want to use.`
 */
const rettiwt = new Rettiwt({ apiKey: API_KEY, proxyUrl: PROXY_URL });
```

This creates a Rettiwt instance which uses the given proxy server for making requests to Twitter.

## Debug logs

Sometimes, when the library shows unexpected behaviour, for troubleshooting purposes, debug logs can be enabled which will help in tracking down the issue and working on a potential fix. Currently, debug logs are printed to the console and are enabled by setting the 'logging' property of the config to true, while creating an instance of Rettiwt:

```ts
/**
 * By default, is no value for 'logging' is supplied, logging is disabled.
 */
const rettiwt = new Rettiwt({ apiKey: API_KEY, logging: true });
```

## CLI Usage

Rettiwt-API provides an easy to use command-line interface which does not require any programming knowledge.

By default, the CLI operates in 'guest' authentication. If you want to use 'user' authentication:

1. Generate an API_KEY as described in [Authentication](https://rishikant181.github.io/Rettiwt-API/#md:authentication).
2. Store the output API_KEY as an environment variable with the name 'API_KEY'.
    - Additionally, store the API_KEY in a file for later use.
    - Make sure to generate an API_KEY only once, and use it every time you need it.
3. The CLI automatically reads this environment variable to authenticate against Twitter.
    - Additionally, the API_KEY can also be passed in manually using the '-k' option as follows: `rettiwt -k <API_KEY> <command>`

Help for the CLI can be obtained from the CLI itself:

- For help regarding the available commands, use the command `rettiwt help`
- For help regarding a specific command, use the command `rettiwt help <command_name>`

## API Reference

The complete API reference can be found at [this](https://rishikant181.github.io/Rettiwt-API/modules) page.

## License

ISC

## Credits

- Original [Rettiwt-API](https://github.com/Rishikant181/Rettiwt-API) by [Rishikant Sahu](https://github.com/Rishikant181)
- Browser extension support by [YouMind Open Lab](https://github.com/youmind-openlab)
