/**
 * Browser extension entry point for Rettiwt-API.
 *
 * This module exports browser-compatible classes that can be used directly in browser extensions.
 * Cookies are automatically retrieved from the browser - no need to pass authentication parameters.
 *
 * @example
 * ```ts
 * import { RettiwtBrowser } from 'rettiwt-api/browser';
 *
 * const rettiwt = new RettiwtBrowser();
 *
 * // Check if logged in
 * if (await rettiwt.isLoggedIn()) {
 *   // Initialize and verify
 *   const user = await rettiwt.initialize();
 *   console.log(`Logged in as: ${user.userName}`);
 *
 *   // Use the API
 *   const tweet = await rettiwt.tweet.details('1234567890');
 * }
 * ```
 *
 * @packageDocumentation
 */

// Main class
export { RettiwtBrowser, IRettiwtBrowserConfig } from './RettiwtBrowser';

// Adapters
export { BrowserCookieProvider, ICookieProvider } from './adapters/CookieProvider';
export { Base64Adapter } from './adapters/Base64Adapter';
export { DomAdapter } from './adapters/DomAdapter';

// Config
export { BrowserRettiwtConfig, IBrowserRettiwtConfig, DefaultBrowserRettiwtHeaders } from './config/BrowserRettiwtConfig';

// Services
export { BrowserFetcherService } from './services/BrowserFetcherService';
export { BrowserAuthService, BrowserAuthCredential } from './services/BrowserAuthService';
export { BrowserUserService } from './services/BrowserUserService';
export { BrowserTweetService, BrowserMedia } from './services/BrowserTweetService';
export { BrowserListService } from './services/BrowserListService';
export { BrowserDirectMessageService } from './services/BrowserDirectMessageService';
export { GraphQLQueryIdResolver } from './services/GraphQLQueryIdResolver';

// Re-export enums (importing directly to avoid Node.js dependencies)
export { RawAnalyticsGranularity, RawAnalyticsMetric } from '../enums/raw/Analytics';
export { RawMediaType } from '../enums/raw/Media';
export { RawNotificationType } from '../enums/raw/Notification';
export { AuthenticationType } from '../enums/Authentication';
export { LogActions } from '../enums/Logging';
export { MediaType } from '../enums/Media';
export { NotificationType } from '../enums/Notification';
export { ResourceType } from '../enums/Resource';
export { TweetRepliesSortType } from '../enums/Tweet';

// Re-export models (importing directly to avoid Node.js dependencies)
export { Analytics } from '../models/data/Analytics';
export { BookmarkFolder } from '../models/data/BookmarkFolder';
export { Conversation } from '../models/data/Conversation';
export { CursoredData } from '../models/data/CursoredData';
export { DirectMessage } from '../models/data/DirectMessage';
export { Inbox } from '../models/data/Inbox';
export { List } from '../models/data/List';
export { Notification } from '../models/data/Notification';
export { Tweet } from '../models/data/Tweet';
export { User } from '../models/data/User';
export { TwitterError } from '../models/errors/TwitterError';

// Re-export types (importing directly to avoid Node.js dependencies)
export type { IFetchArgs, ITweetFilter } from '../types/args/FetchArgs';
export type { IPostArgs, INewTweet } from '../types/args/PostArgs';
export type { IProfileUpdateOptions } from '../types/args/ProfileArgs';
export type { IAuthCookie } from '../types/auth/AuthCookie';
export type { IAuthCredential } from '../types/auth/AuthCredential';
export type { IErrorHandler } from '../types/ErrorHandler';

// Factory function for creating initialized RettiwtBrowser instance
import { RettiwtBrowser } from './RettiwtBrowser';
import type { IRettiwtBrowserConfig } from './RettiwtBrowser';
import { User } from '../models/data/User';

/**
 * Creates and initializes a RettiwtBrowser instance.
 * This is a convenience function that creates a new instance and calls initialize().
 *
 * @param config - Optional configuration options.
 * @returns A promise resolving to an object containing the initialized rettiwt instance and the user.
 * @throws Error if not logged in or initialization fails.
 *
 * @example
 * ```ts
 * import { createRettiwtBrowser } from 'rettiwt-api/browser';
 *
 * const { rettiwt, user } = await createRettiwtBrowser();
 * console.log(`Logged in as: ${user.userName}`);
 *
 * const tweet = await rettiwt.tweet.details('1234567890');
 * ```
 */
export async function createRettiwtBrowser(
	config?: IRettiwtBrowserConfig,
): Promise<{ rettiwt: RettiwtBrowser; user: User }> {
	const rettiwt = new RettiwtBrowser(config);
	const user = await rettiwt.initialize();
	return { rettiwt, user };
}
