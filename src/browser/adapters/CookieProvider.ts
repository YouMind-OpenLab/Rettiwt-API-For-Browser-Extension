import { IAuthCookie } from '../../types/auth/AuthCookie';

/**
 * Interface for cookie retrieval, allowing different implementations
 * for browser extension vs other environments.
 *
 * @public
 */
export interface ICookieProvider {
	/**
	 * Retrieves Twitter authentication cookies.
	 * @returns Promise resolving to cookies in the format expected by AuthCookie
	 */
	getCookies(): Promise<IAuthCookie>;

	/**
	 * Checks if required cookies exist for authentication.
	 * @returns Promise resolving to true if all required cookies are present
	 */
	hasRequiredCookies(): Promise<boolean>;
}

/**
 * Browser extension implementation using chrome.cookies API.
 * Automatically retrieves Twitter cookies from the browser.
 *
 * @public
 */
export class BrowserCookieProvider implements ICookieProvider {
	private readonly domain = '.x.com';
	private readonly requiredCookieNames = ['auth_token', 'ct0', 'twid'];

	/**
	 * Retrieves Twitter authentication cookies from the browser.
	 * Requires the "cookies" permission in manifest.json.
	 *
	 * @returns The authentication cookies
	 */
	async getCookies(): Promise<IAuthCookie> {
		const cookies = await chrome.cookies.getAll({ domain: this.domain });

		const result: IAuthCookie = {
			auth_token: '',
			ct0: '',
			kdt: '',
			twid: '',
		};

		for (const cookie of cookies) {
			if (cookie.name === 'auth_token') {
				result.auth_token = cookie.value;
			} else if (cookie.name === 'ct0') {
				result.ct0 = cookie.value;
			} else if (cookie.name === 'kdt') {
				result.kdt = cookie.value;
			} else if (cookie.name === 'twid') {
				result.twid = cookie.value;
			}
		}

		return result;
	}

	/**
	 * Checks if the user is logged in by verifying required cookies exist.
	 *
	 * @returns true if all required cookies are present
	 */
	async hasRequiredCookies(): Promise<boolean> {
		const cookies = await this.getCookies();
		return !!(cookies.auth_token && cookies.ct0 && cookies.twid);
	}
}
