import { IAuthCookie } from '../../types/auth/AuthCookie';
import { IErrorHandler } from '../../types/ErrorHandler';

/**
 * The default headers for browser requests.
 *
 * @internal
 */
const DefaultHeaders = {
	/* eslint-disable @typescript-eslint/naming-convention */

	Authority: 'x.com',
	'Accept-Language': 'en-US,en;q=0.9',
	'Cache-Control': 'no-cache',
	Referer: 'https://x.com',
	'X-Twitter-Active-User': 'yes',
	'X-Twitter-Client-Language': 'en',

	/* eslint-enable @typescript-eslint/naming-convention */
};

/**
 * Configuration options for BrowserRettiwt.
 *
 * @public
 */
export interface IBrowserRettiwtConfig {
	/** The max wait time (in milli-seconds) for a response. */
	timeout?: number;

	/** Whether to write logs to console or not. */
	logging?: boolean;

	/** Optional custom error handler. */
	errorHandler?: IErrorHandler;

	/** Optional custom HTTP headers. */
	headers?: { [key: string]: string };

	/** The delay (in ms) between concurrent requests. */
	delay?: number | (() => number | Promise<number>);

	/** The maximum number of retries. */
	maxRetries?: number;
}

/**
 * Browser-specific configuration for Rettiwt.
 * Does not include proxy agent (not applicable in browser).
 *
 * @public
 */
export class BrowserRettiwtConfig {
	// Internal state
	private _userId?: string;
	private _cookies?: string;
	private _csrfToken?: string;
	private _headers: { [key: string]: string };
	private _initialized: boolean = false;

	// Public readonly config
	public readonly delay?: number | (() => number | Promise<number>);
	public readonly errorHandler?: IErrorHandler;
	public readonly logging?: boolean;
	public readonly maxRetries: number;
	public readonly timeout?: number;

	/**
	 * Creates a new BrowserRettiwtConfig instance.
	 *
	 * @param config - The configuration options
	 */
	public constructor(config?: IBrowserRettiwtConfig) {
		this.delay = config?.delay ?? 0;
		this.maxRetries = config?.maxRetries ?? 5;
		this.errorHandler = config?.errorHandler;
		this.logging = config?.logging;
		this.timeout = config?.timeout;
		this._headers = {
			...DefaultHeaders,
			...config?.headers,
		};
	}

	/**
	 * Initializes the config with cookies obtained from the browser.
	 *
	 * @param cookies - The authentication cookies
	 */
	public initializeWithCookies(cookies: IAuthCookie): void {
		// Extract user ID from twid cookie
		// twid format: "u=1234567890" or URL-encoded "u%3D1234567890"
		const twidMatch = cookies.twid.match(/u[=%]3[dD]?(\d+)/);
		if (twidMatch) {
			this._userId = twidMatch[1];
		}

		// Store CSRF token
		this._csrfToken = cookies.ct0;

		// Build cookie string
		this._cookies = `auth_token=${cookies.auth_token};ct0=${cookies.ct0};kdt=${cookies.kdt};twid=${cookies.twid}`;

		this._initialized = true;
	}

	/**
	 * Whether the config has been initialized with cookies.
	 */
	public get isInitialized(): boolean {
		return this._initialized;
	}

	/**
	 * The ID of the authenticated user.
	 */
	public get userId(): string | undefined {
		return this._userId;
	}

	/**
	 * The HTTP headers to use for requests.
	 */
	public get headers(): { [key: string]: string } {
		return this._headers;
	}

	/**
	 * The cookie string for authentication.
	 */
	public get cookies(): string | undefined {
		return this._cookies;
	}

	/**
	 * The CSRF token for the session.
	 */
	public get csrfToken(): string | undefined {
		return this._csrfToken;
	}

	/**
	 * The HTTPS agent (undefined in browser - not applicable).
	 */
	public get httpsAgent(): undefined {
		return undefined;
	}

	/**
	 * The API key (returns undefined - browser uses cookies directly).
	 */
	public get apiKey(): undefined {
		return undefined;
	}

	/**
	 * Sets custom headers.
	 */
	public set headers(headers: { [key: string]: string } | undefined) {
		this._headers = {
			...DefaultHeaders,
			...headers,
		};
	}
}

export { DefaultHeaders as DefaultBrowserRettiwtHeaders };
