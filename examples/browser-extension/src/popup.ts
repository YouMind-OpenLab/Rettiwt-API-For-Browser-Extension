import { RettiwtBrowser, User, Tweet } from 'rettiwt-api/browser';

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
let rettiwt: RettiwtBrowser | null = null;
let currentTab: 'bookmarks' | 'search' = 'bookmarks';
let bookmarks: Tweet[] = [];
let searchResults: Tweet[] = [];
let bookmarksCursor: string | undefined;
let searchCursor: string | undefined;
let isLoading = false;
let hasMoreBookmarks = true;
let hasMoreSearch = true;
let currentSearchQuery = '';

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
function displayProfile(user: User) {
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
function renderTweetCard(tweet: Tweet): string {
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
	// The loading indicator is managed by the load functions
	if (!hasMore && !isLoading) {
		loadMoreEl.classList.add('hidden');
	}
}

/**
 * Load more bookmarks
 */
async function loadMoreBookmarks() {
	if (!rettiwt || isLoading || !hasMoreBookmarks) return;

	isLoading = true;
	loadMoreEl.classList.remove('hidden');

	try {
		const result = await rettiwt.user.bookmarks(20, bookmarksCursor);

		if (!result.list || result.list.length === 0) {
			hasMoreBookmarks = false;
		} else {
			bookmarks.push(...result.list);
			bookmarksCursor = result.next;
			hasMoreBookmarks = !!bookmarksCursor;
		}
	} catch (error) {
		console.error('Error loading bookmarks:', error);
		hasMoreBookmarks = false; // Stop trying on error
	} finally {
		isLoading = false;
		loadMoreEl.classList.add('hidden');
		updateContentList();
	}
}

/**
 * Load more search results
 */
async function loadMoreSearchResults() {
	if (!rettiwt || isLoading || !hasMoreSearch || !currentSearchQuery) return;

	isLoading = true;
	loadMoreEl.classList.remove('hidden');

	try {
		console.log('Searching for:', currentSearchQuery, 'cursor:', searchCursor);
		const result = await rettiwt.tweet.search(
			{ includeWords: [currentSearchQuery] },
			20,
			searchCursor,
		);
		console.log('Search result:', result);

		if (!result.list || result.list.length === 0) {
			hasMoreSearch = false;
		} else {
			searchResults.push(...result.list);
			searchCursor = result.next;
			hasMoreSearch = !!searchCursor;
		}
	} catch (error) {
		console.error('Error loading search results:', error);
		// Show error to user
		if (searchResults.length === 0) {
			contentListEl.innerHTML = `<div class="empty-state">Search failed: ${error instanceof Error ? error.message : 'Unknown error'}</div>`;
		}
		hasMoreSearch = false; // Stop trying on error
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
	if (!rettiwt) return;

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
		console.log('Near bottom detected', { scrollTop, scrollHeight, clientHeight, isLoading, hasMoreBookmarks, hasMoreSearch });
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
		rettiwt = new RettiwtBrowser();

		// Check if logged in (just checks cookies, no API call)
		const isLoggedIn = await rettiwt.isLoggedIn();

		if (!isLoggedIn) {
			setStatus('Not logged in to X.com', 'error');
			loginPromptEl.classList.remove('hidden');
			return;
		}

		setStatus('Verifying credentials...', 'loading');

		// Initialize and verify (fetches user profile)
		const user = await rettiwt.initialize();

		setStatus('Successfully connected!', 'success');
		mainContentEl.classList.remove('hidden');
		displayProfile(user);

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
