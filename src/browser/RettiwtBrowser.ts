import { User } from '../models/data/User';
import { IAuthCookie } from '../types/auth/AuthCookie';

import { BrowserCookieProvider, ICookieProvider } from './adapters/CookieProvider';
import { BrowserRettiwtConfig, IBrowserRettiwtConfig } from './config/BrowserRettiwtConfig';
import { BrowserDirectMessageService } from './services/BrowserDirectMessageService';
import { BrowserListService } from './services/BrowserListService';
import { BrowserTweetService } from './services/BrowserTweetService';
import { BrowserUserService } from './services/BrowserUserService';

/**
 * Configuration options for RettiwtBrowser.
 *
 * @public
 */
export interface IRettiwtBrowserConfig extends IBrowserRettiwtConfig {
	/**
	 * Custom cookie provider. If not provided, uses BrowserCookieProvider
	 * which gets cookies from chrome.cookies API.
	 */
	cookieProvider?: ICookieProvider;
}

/**
 * Browser extension-specific Rettiwt class.
 * Automatically retrieves cookies from browser context - no need to pass authentication parameters.
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
 * @public
 */
export class RettiwtBrowser {
	/** The configuration for Rettiwt. */
	private _config: BrowserRettiwtConfig;

	/** The cookie provider for getting Twitter cookies. */
	private _cookieProvider: ICookieProvider;

	/** Whether the instance has been initialized. */
	private _initialized: boolean = false;

	/** The cached cookies. */
	private _cookies?: IAuthCookie;

	/** The instance used to fetch data related to direct messages. */
	public dm!: BrowserDirectMessageService;

	/** The instance used to fetch data related to lists. */
	public list!: BrowserListService;

	/** The instance used to fetch data related to tweets. */
	public tweet!: BrowserTweetService;

	/** The instance used to fetch data related to users. */
	public user!: BrowserUserService;

	/**
	 * Creates a new RettiwtBrowser instance.
	 *
	 * @param config - Optional configuration options.
	 */
	public constructor(config?: IRettiwtBrowserConfig) {
		this._cookieProvider = config?.cookieProvider ?? new BrowserCookieProvider();
		this._config = new BrowserRettiwtConfig(config);
	}

	/**
	 * Checks if the user is logged in to Twitter.
	 * This method only checks for the presence of required cookies - it does NOT make any API calls.
	 *
	 * @returns true if the required Twitter authentication cookies are present.
	 *
	 * @example
	 * ```ts
	 * const rettiwt = new RettiwtBrowser();
	 *
	 * if (await rettiwt.isLoggedIn()) {
	 *   console.log('User is logged in to Twitter');
	 * } else {
	 *   console.log('User is not logged in');
	 * }
	 * ```
	 */
	public async isLoggedIn(): Promise<boolean> {
		return this._cookieProvider.hasRequiredCookies();
	}

	/**
	 * Initializes the library by getting cookies from the browser and verifying authentication.
	 * This method must be called before using other methods.
	 *
	 * The method:
	 * 1. Gets Twitter authentication cookies from the browser
	 * 2. Initializes the configuration with these cookies
	 * 3. Creates the service instances (dm, list, tweet, user)
	 * 4. Verifies authentication by fetching the current user's profile
	 *
	 * @returns The authenticated user's profile.
	 * @throws Error if not logged in to Twitter or if authentication verification fails.
	 *
	 * @example
	 * ```ts
	 * const rettiwt = new RettiwtBrowser();
	 *
	 * try {
	 *   const user = await rettiwt.initialize();
	 *   console.log(`Logged in as: ${user.userName}`);
	 * } catch (error) {
	 *   console.error('Failed to initialize:', error.message);
	 * }
	 * ```
	 */
	public async initialize(): Promise<User> {
		// Get cookies from browser
		const cookies = await this._cookieProvider.getCookies();

		if (!cookies.auth_token || !cookies.ct0) {
			throw new Error('Not logged in to Twitter. Please log in to Twitter first.');
		}

		// Store cookies
		this._cookies = cookies;

		// Initialize config with cookies
		this._config.initializeWithCookies(cookies);

		// Create service instances
		this.dm = new BrowserDirectMessageService(this._config);
		this.list = new BrowserListService(this._config);
		this.tweet = new BrowserTweetService(this._config);
		this.user = new BrowserUserService(this._config);

		// Set cookies for each service
		this.dm.setCookies(cookies);
		this.list.setCookies(cookies);
		this.tweet.setCookies(cookies);
		this.user.setCookies(cookies);

		// Verify by fetching user profile
		const user = await this.user.details();

		if (!user) {
			throw new Error('Failed to verify authentication. Please try logging in to Twitter again.');
		}

		this._initialized = true;
		return user;
	}

	/**
	 * Alias for initialize() - verifies authentication and returns user profile.
	 *
	 * @returns The authenticated user's profile.
	 * @throws Error if not logged in or verification fails.
	 */
	public async verify(): Promise<User> {
		return this.initialize();
	}

	/**
	 * Whether the instance has been initialized.
	 */
	public get isInitialized(): boolean {
		return this._initialized;
	}

	/**
	 * Gets the authenticated user's ID (extracted from twid cookie).
	 * Returns undefined if not initialized.
	 */
	public get userId(): string | undefined {
		return this._config.userId;
	}

	/**
	 * Gets the current authentication cookies.
	 * Returns undefined if not initialized.
	 */
	public get cookies(): IAuthCookie | undefined {
		return this._cookies;
	}

	/**
	 * Sets custom headers for all API requests.
	 */
	public set headers(headers: { [key: string]: string }) {
		this._config.headers = headers;
	}
}
