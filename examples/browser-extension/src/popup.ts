/**
 * Popup script for Rettiwt Browser Extension Demo
 * Communicates with background service worker via chrome.runtime messages
 */

import type { MessageType, ResponseType } from './background';

// Types for serialized data from background
interface SerializedUser {
	id: string;
	userName: string;
	fullName: string;
	profileImage: string;
	followersCount: number;
	followingsCount: number;
	statusesCount?: number;
}

interface SerializedTweet {
	id: string;
	fullText: string;
	createdAt: string;
	likeCount: number;
	retweetCount: number;
	replyCount: number;
	tweetBy: {
		id: string;
		userName: string;
		fullName: string;
		profileImage: string;
	} | null;
}

interface CursoredResponse<T> {
	list: T[];
	next: string;
}

// DOM Elements
const statusEl = document.getElementById('status') as HTMLDivElement;
const loginPromptEl = document.getElementById('login-prompt') as HTMLDivElement;
const mainContentEl = document.getElementById('main-content') as HTMLDivElement;
const retryBtn = document.getElementById('retry-btn') as HTMLButtonElement;

// Profile elements
const profileAvatarEl = document.getElementById('profile-avatar') as HTMLImageElement;
const profileNameEl = document.getElementById('profile-name') as HTMLElement;
const profileUsernameEl = document.getElementById('profile-username') as HTMLElement;
const followersCountEl = document.getElementById('followers-count') as HTMLElement;
const followingCountEl = document.getElementById('following-count') as HTMLElement;
const tweetsCountEl = document.getElementById('tweets-count') as HTMLElement;

// Tab elements
const tabBookmarksEl = document.getElementById('tab-bookmarks') as HTMLButtonElement;
const tabSearchEl = document.getElementById('tab-search') as HTMLButtonElement;
const searchSectionEl = document.getElementById('search-section') as HTMLDivElement;
const searchInputEl = document.getElementById('search-input') as HTMLInputElement;
const searchBtnEl = document.getElementById('search-btn') as HTMLButtonElement;

// Content elements
const sectionTitleEl = document.getElementById('section-title') as HTMLElement;
const itemCountEl = document.getElementById('item-count') as HTMLElement;
const contentListEl = document.getElementById('content-list') as HTMLDivElement;
const loadMoreEl = document.getElementById('load-more') as HTMLDivElement;

// Global state
let currentUser: SerializedUser | null = null;
let currentTab: 'bookmarks' | 'search' = 'bookmarks';
let bookmarks: SerializedTweet[] = [];
let searchResults: SerializedTweet[] = [];
let bookmarksCursor: string | undefined;
let searchCursor: string | undefined;
let isLoading = false;
let hasMoreBookmarks = true;
let hasMoreSearch = true;
let currentSearchQuery = '';

/**
 * Send message to background service worker
 */
async function sendMessage<T>(message: MessageType): Promise<T> {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage(message, (response: ResponseType) => {
			if (chrome.runtime.lastError) {
				reject(new Error(chrome.runtime.lastError.message));
				return;
			}
			if (response.success) {
				resolve(response.data as T);
			} else {
				reject(new Error(response.error));
			}
		});
	});
}

/**
 * Update status display
 */
function setStatus(message: string, type: 'loading' | 'success' | 'error') {
	statusEl.className = `status ${type}`;
	if (type === 'loading') {
		statusEl.innerHTML = `<span class="loading-spinner"></span>${message}`;
	} else {
		statusEl.textContent = message;
	}
}

/**
 * Format large numbers (e.g., 1000 -> 1K)
 */
function formatNumber(num: number): string {
	if (num >= 1000000) {
		return (num / 1000000).toFixed(1) + 'M';
	}
	if (num >= 1000) {
		return (num / 1000).toFixed(1) + 'K';
	}
	return num.toString();
}

/**
 * Display user profile
 */
function displayProfile(user: SerializedUser) {
	profileAvatarEl.src = user.profileImage || '';
	profileNameEl.textContent = user.fullName || 'Unknown';
	profileUsernameEl.textContent = `@${user.userName || 'unknown'}`;
	followersCountEl.textContent = formatNumber(user.followersCount || 0);
	followingCountEl.textContent = formatNumber(user.followingsCount || 0);
	tweetsCountEl.textContent = formatNumber(user.statusesCount || 0);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

/**
 * Render a single tweet card
 */
function renderTweetCard(tweet: SerializedTweet): string {
	const author = tweet.tweetBy;
	const avatarUrl = author?.profileImage || '';
	const authorName = author?.fullName || 'Unknown';
	const authorHandle = author?.userName || 'unknown';
	const text = tweet.fullText || '';
	const likes = formatNumber(tweet.likeCount || 0);
	const retweets = formatNumber(tweet.retweetCount || 0);
	const replies = formatNumber(tweet.replyCount || 0);

	return `
    <div class="tweet-card">
      <div class="tweet-header">
        <img class="tweet-avatar" src="${avatarUrl}" alt="Avatar" onerror="this.style.display='none'">
        <div>
          <div class="tweet-author">${escapeHtml(authorName)}</div>
          <div class="tweet-handle">@${escapeHtml(authorHandle)}</div>
        </div>
      </div>
      <div class="tweet-text">${escapeHtml(text)}</div>
      <div class="tweet-stats">
        <span>${replies} replies</span>
        <span>${retweets} retweets</span>
        <span>${likes} likes</span>
      </div>
    </div>
  `;
}

/**
 * Update the content list display
 */
function updateContentList() {
	const items = currentTab === 'bookmarks' ? bookmarks : searchResults;
	const hasMore = currentTab === 'bookmarks' ? hasMoreBookmarks : hasMoreSearch;

	if (items.length === 0 && !isLoading) {
		contentListEl.innerHTML = `<div class="empty-state">${
			currentTab === 'bookmarks' ? 'No bookmarks found' : 'No search results'
		}</div>`;
	} else {
		contentListEl.innerHTML = items.map(renderTweetCard).join('');
	}

	itemCountEl.textContent = items.length > 0 ? `${items.length} items` : '';

	// Only hide load-more when there's definitely no more content
	if (!hasMore && !isLoading) {
		loadMoreEl.classList.add('hidden');
	}
}

/**
 * Load more bookmarks via background script
 */
async function loadMoreBookmarks() {
	if (isLoading || !hasMoreBookmarks) return;

	isLoading = true;
	loadMoreEl.classList.remove('hidden');

	try {
		const result = await sendMessage<CursoredResponse<SerializedTweet>>({
			type: 'GET_BOOKMARKS',
			count: 20,
			cursor: bookmarksCursor,
		});

		if (!result.list || result.list.length === 0) {
			hasMoreBookmarks = false;
		} else {
			bookmarks.push(...result.list);
			bookmarksCursor = result.next || undefined;
			hasMoreBookmarks = !!bookmarksCursor;
		}
	} catch (error) {
		console.error('Error loading bookmarks:', error);
		hasMoreBookmarks = false;
	} finally {
		isLoading = false;
		loadMoreEl.classList.add('hidden');
		updateContentList();
	}
}

/**
 * Load more search results via background script
 */
async function loadMoreSearchResults() {
	if (isLoading || !hasMoreSearch || !currentSearchQuery) return;

	isLoading = true;
	loadMoreEl.classList.remove('hidden');

	try {
		console.log('Searching for:', currentSearchQuery, 'cursor:', searchCursor);
		const result = await sendMessage<CursoredResponse<SerializedTweet>>({
			type: 'SEARCH_TWEETS',
			query: currentSearchQuery,
			count: 20,
			cursor: searchCursor,
		});
		console.log('Search result:', result);

		if (!result.list || result.list.length === 0) {
			hasMoreSearch = false;
		} else {
			searchResults.push(...result.list);
			searchCursor = result.next || undefined;
			hasMoreSearch = !!searchCursor;
		}
	} catch (error) {
		console.error('Error loading search results:', error);
		if (searchResults.length === 0) {
			contentListEl.innerHTML = `<div class="empty-state">Search failed: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
		}
		hasMoreSearch = false;
	} finally {
		isLoading = false;
		loadMoreEl.classList.add('hidden');
		updateContentList();
	}
}

/**
 * Perform search
 */
async function performSearch() {
	const query = searchInputEl.value.trim();
	if (!query) return;

	// Reset search state
	currentSearchQuery = query;
	searchResults = [];
	searchCursor = undefined;
	hasMoreSearch = true;

	searchBtnEl.disabled = true;
	searchBtnEl.textContent = 'Searching...';

	try {
		await loadMoreSearchResults();
	} finally {
		searchBtnEl.disabled = false;
		searchBtnEl.textContent = 'Search';
	}
}

/**
 * Switch tab
 */
function switchTab(tab: 'bookmarks' | 'search') {
	currentTab = tab;

	// Update tab styles
	tabBookmarksEl.classList.toggle('active', tab === 'bookmarks');
	tabSearchEl.classList.toggle('active', tab === 'search');

	// Show/hide search section
	searchSectionEl.classList.toggle('hidden', tab !== 'search');

	// Update section title
	sectionTitleEl.textContent = tab === 'bookmarks' ? 'Bookmarks' : 'Search Results';

	// Update content
	updateContentList();

	// Auto-load bookmarks if switching to bookmarks tab and empty
	if (tab === 'bookmarks' && bookmarks.length === 0 && hasMoreBookmarks) {
		loadMoreBookmarks();
	}
}

/**
 * Handle scroll for infinite loading
 */
function handleScroll() {
	const scrollTop = contentListEl.scrollTop;
	const scrollHeight = contentListEl.scrollHeight;
	const clientHeight = contentListEl.clientHeight;

	// Load more when scrolled near bottom (within 150px)
	if (scrollTop + clientHeight >= scrollHeight - 150) {
		console.log('Near bottom detected', {
			scrollTop,
			scrollHeight,
			clientHeight,
			isLoading,
			hasMoreBookmarks,
			hasMoreSearch,
		});
		if (currentTab === 'bookmarks' && !isLoading && hasMoreBookmarks) {
			loadMoreBookmarks();
		} else if (currentTab === 'search' && currentSearchQuery && !isLoading && hasMoreSearch) {
			loadMoreSearchResults();
		}
	}
}

/**
 * Initialize the extension
 */
async function initialize() {
	setStatus('Checking login status...', 'loading');
	loginPromptEl.classList.add('hidden');
	mainContentEl.classList.add('hidden');

	try {
		// Check if logged in via background script
		const loginResult = await sendMessage<{ isLoggedIn: boolean }>({ type: 'CHECK_LOGIN' });

		if (!loginResult.isLoggedIn) {
			setStatus('Not logged in to X.com', 'error');
			loginPromptEl.classList.remove('hidden');
			return;
		}

		setStatus('Verifying credentials...', 'loading');

		// Initialize and verify via background script
		const initResult = await sendMessage<{ user: SerializedUser }>({ type: 'INITIALIZE' });
		currentUser = initResult.user;

		setStatus('Successfully connected!', 'success');
		mainContentEl.classList.remove('hidden');
		displayProfile(currentUser);

		// Auto-load bookmarks
		await loadMoreBookmarks();
	} catch (error) {
		console.error('Initialization error:', error);
		setStatus(`Error: ${error instanceof Error ? error.message : 'Failed to initialize'}`, 'error');
		loginPromptEl.classList.remove('hidden');
	}
}

// Event listeners
retryBtn.addEventListener('click', initialize);
tabBookmarksEl.addEventListener('click', () => switchTab('bookmarks'));
tabSearchEl.addEventListener('click', () => switchTab('search'));
searchBtnEl.addEventListener('click', performSearch);
searchInputEl.addEventListener('keypress', (e) => {
	if (e.key === 'Enter') {
		performSearch();
	}
});
contentListEl.addEventListener('scroll', handleScroll);

// Initialize on load
document.addEventListener('DOMContentLoaded', initialize);
