import axios from 'axios';

import { AuthenticationType } from '../../enums/Authentication';
import { IAuthCookie } from '../../types/auth/AuthCookie';
import { IAuthCredential } from '../../types/auth/AuthCredential';
import { BrowserRettiwtConfig } from '../config/BrowserRettiwtConfig';
import { Base64Adapter } from '../adapters/Base64Adapter';

/**
 * Browser-compatible AuthCredential that doesn't depend on cookiejar.
 *
 * @internal
 */
export class BrowserAuthCredential implements IAuthCredential {
	public authToken?: string;
	public authenticationType?: AuthenticationType;
	public cookies?: string;
	public csrfToken?: string;
	public guestToken?: string;

	/**
	 * Creates a new BrowserAuthCredential from IAuthCookie.
	 *
	 * @param cookies - The authentication cookies from browser
	 * @param guestToken - Optional guest token for guest authentication
	 */
	public constructor(cookies?: IAuthCookie, guestToken?: string) {
		this.authToken =
			'AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA';

		// If guest credentials given
		if (!cookies && guestToken) {
			this.guestToken = guestToken;
			this.authenticationType = AuthenticationType.GUEST;
		}
		// If user credentials given
		else if (cookies && !guestToken) {
			this.cookies = `auth_token=${cookies.auth_token};ct0=${cookies.ct0};kdt=${cookies.kdt};twid=${cookies.twid}`;
			this.csrfToken = cookies.ct0;
			this.authenticationType = AuthenticationType.USER;
		}
		// If login credentials given (both cookies and guest token)
		else if (cookies && guestToken) {
			this.cookies = `auth_token=${cookies.auth_token};ct0=${cookies.ct0};kdt=${cookies.kdt};twid=${cookies.twid}`;
			this.guestToken = guestToken;
			this.authenticationType = AuthenticationType.LOGIN;
		}
	}

	/**
	 * Converts the credentials to HTTP headers.
	 *
	 * @returns The headers object for axios requests
	 */
	public toHeader(): Record<string, string> {
		const headers: Record<string, string> = {};

		if (this.authToken) {
			headers['authorization'] = `Bearer ${this.authToken}`;
		}
		if (this.guestToken) {
			headers['x-guest-token'] = this.guestToken;
		}
		if (this.csrfToken) {
			headers['x-csrf-token'] = this.csrfToken;
		}
		if (this.cookies) {
			headers['cookie'] = this.cookies;
		}

		return headers;
	}
}

/**
 * Browser-compatible authentication service.
 * Uses atob/btoa instead of Node.js Buffer.
 *
 * @internal
 */
export class BrowserAuthService {
	/** The config object. */
	private readonly _config: BrowserRettiwtConfig;

	/**
	 * @param config - The browser config for Rettiwt.
	 */
	public constructor(config: BrowserRettiwtConfig) {
		this._config = config;
	}

	/**
	 * Decodes the encoded cookie string using browser-native atob.
	 *
	 * @param encodedCookies - The encoded cookie string to decode.
	 * @returns The decoded cookie string.
	 */
	public static decodeCookie(encodedCookies: string): string {
		return Base64Adapter.decode(encodedCookies);
	}

	/**
	 * Encodes the given cookie string using browser-native btoa.
	 *
	 * @param cookieString - The cookie string to encode.
	 * @returns The encoded cookie string.
	 */
	public static encodeCookie(cookieString: string): string {
		return Base64Adapter.encode(cookieString);
	}

	/**
	 * Gets the user's id from the given API key.
	 *
	 * @param apiKey - The API key (base64 encoded cookie string).
	 * @returns The user id associated with the API key.
	 */
	public static getUserId(apiKey: string): string | undefined {
		const cookieString = BrowserAuthService.decodeCookie(apiKey);
		const searchResults = cookieString.match(/((?<=twid="u=)(\d+)(?="))|((?<=twid=u%3D)(\d+)(?=;))/);
		return searchResults ? searchResults[0] : undefined;
	}

	/**
	 * Gets the user's id from the twid cookie value.
	 *
	 * @param twid - The twid cookie value.
	 * @returns The user id.
	 */
	public static getUserIdFromTwid(twid: string): string | undefined {
		// twid format: "u=1234567890" or URL-encoded "u%3D1234567890"
		const match = twid.match(/u[=%]3[dD]?(\d+)/);
		return match ? match[1] : undefined;
	}

	/**
	 * Login to twitter as guest.
	 *
	 * @returns A new guest credential.
	 */
	public async guest(): Promise<BrowserAuthCredential> {
		// Creating a new blank credential
		const cred = new BrowserAuthCredential();

		// Getting the guest token
		const response = await axios.post<{ guest_token: string }>(
			'https://api.twitter.com/1.1/guest/activate.json',
			undefined,
			{
				headers: cred.toHeader(),
			},
		);

		cred.guestToken = response.data.guest_token;

		return cred;
	}
}
