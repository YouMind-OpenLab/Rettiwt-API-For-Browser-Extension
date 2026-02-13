/**
 * Background service worker for Rettiwt Browser Extension
 * Handles all API calls and communicates with popup via chrome.runtime messages
 */

import { RettiwtBrowser } from '../../../src/browser';
import { Tweet } from '../../../src/models/data/Tweet';
import { User } from '../../../src/models/data/User';

// Global state
let rettiwt: RettiwtBrowser | null = null;
let currentUser: User | null = null;

// Message types
export type MessageType =
	| { type: 'CHECK_LOGIN' }
	| { type: 'INITIALIZE' }
	| { type: 'GET_USER' }
	| { type: 'GET_BOOKMARKS'; count?: number; cursor?: string }
	| { type: 'SEARCH_TWEETS'; query: string; count?: number; cursor?: string };

export type ResponseType =
	| { success: true; data: unknown }
	| { success: false; error: string };

/**
 * Initialize RettiwtBrowser instance
 */
async function ensureRettiwt(): Promise<RettiwtBrowser> {
	if (!rettiwt) {
		rettiwt = new RettiwtBrowser({ logging: true });
	}
	return rettiwt;
}

/**
 * Handle incoming messages from popup
 */
chrome.runtime.onMessage.addListener(
	(message: MessageType, _sender, sendResponse: (response: ResponseType) => void) => {
		handleMessage(message)
			.then((data) => sendResponse({ success: true, data }))
			.catch((error) => {
				console.error('Background error:', error);
				sendResponse({
					success: false,
					error: error instanceof Error ? error.message : String(error),
				});
			});

		// Return true to indicate we'll respond asynchronously
		return true;
	},
);

/**
 * Process messages and return results
 */
async function handleMessage(message: MessageType): Promise<unknown> {
	const api = await ensureRettiwt();

	switch (message.type) {
		case 'CHECK_LOGIN': {
			const isLoggedIn = await api.isLoggedIn();
			return { isLoggedIn };
		}

		case 'INITIALIZE': {
			currentUser = await api.initialize();
			return {
				user: {
					id: currentUser.id,
					userName: currentUser.userName,
					fullName: currentUser.fullName,
					profileImage: currentUser.profileImage,
					followersCount: currentUser.followersCount,
					followingsCount: currentUser.followingsCount,
				},
			};
		}

		case 'GET_USER': {
			if (!currentUser) {
				throw new Error('Not initialized');
			}
			return {
				user: {
					id: currentUser.id,
					userName: currentUser.userName,
					fullName: currentUser.fullName,
					profileImage: currentUser.profileImage,
					followersCount: currentUser.followersCount,
					followingsCount: currentUser.followingsCount,
				},
			};
		}

		case 'GET_BOOKMARKS': {
			if (!api.isInitialized) {
				throw new Error('Not initialized');
			}
			const bookmarks = await api.user.bookmarks(message.count ?? 20, message.cursor);
			return {
				list: bookmarks.list.map(serializeTweet),
				next: bookmarks.next,
			};
		}

		case 'SEARCH_TWEETS': {
			if (!api.isInitialized) {
				throw new Error('Not initialized');
			}
			const results = await api.tweet.search(
				{ includeWords: [message.query] },
				message.count ?? 20,
				message.cursor,
			);
			return {
				list: results.list.map(serializeTweet),
				next: results.next,
			};
		}

		default:
			throw new Error(`Unknown message type: ${(message as { type: string }).type}`);
	}
}

/**
 * Serialize a Tweet object to a plain object for message passing
 */
function serializeTweet(tweet: Tweet): Record<string, unknown> {
	return {
		id: tweet.id,
		fullText: tweet.fullText,
		createdAt: tweet.createdAt,
		likeCount: tweet.likeCount,
		retweetCount: tweet.retweetCount,
		replyCount: tweet.replyCount,
		tweetBy: tweet.tweetBy
			? {
					id: tweet.tweetBy.id,
					userName: tweet.tweetBy.userName,
					fullName: tweet.tweetBy.fullName,
					profileImage: tweet.tweetBy.profileImage,
				}
			: null,
	};
}

console.log('Rettiwt background service worker loaded');
