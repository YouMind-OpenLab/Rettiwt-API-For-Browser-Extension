import axios, { AxiosError, isAxiosError } from 'axios';
import { ClientTransaction } from 'x-client-transaction-id';

import { AllowGuestAuthenticationGroup, FetchResourcesGroup, PostResourcesGroup } from '../../collections/Groups';
import { Requests } from '../../collections/Requests';
import { ApiErrors } from '../../enums/Api';
import { LogActions } from '../../enums/Logging';
import { ResourceType } from '../../enums/Resource';
import { FetchArgs } from '../../models/args/FetchArgs';
import { PostArgs } from '../../models/args/PostArgs';
import { TwitterError } from '../../models/errors/TwitterError';
import { IFetchArgs } from '../../types/args/FetchArgs';
import { IPostArgs } from '../../types/args/PostArgs';
import { IAuthCookie } from '../../types/auth/AuthCookie';
import { ITransactionHeader } from '../../types/auth/TransactionHeader';
import { IErrorHandler } from '../../types/ErrorHandler';
import { IErrorData } from '../../types/raw/base/Error';

import { ErrorService } from '../../services/internal/ErrorService';
import { LogService } from '../../services/internal/LogService';

import { DomAdapter } from '../adapters/DomAdapter';
import { BrowserRettiwtConfig } from '../config/BrowserRettiwtConfig';
import { BrowserAuthCredential, BrowserAuthService } from './BrowserAuthService';

/**
 * Browser-compatible fetcher service.
 * Uses native DOMParser instead of JSDOM, and browser cookies instead of base64 encoded API key.
 *
 * @public
 */
export class BrowserFetcherService {
	/** The AuthService instance to use. */
	protected readonly _auth: BrowserAuthService;

	/** The delay/delay function to use (ms). */
	private readonly _delay?: number | (() => number | Promise<number>);

	/** The service used to handle HTTP and API errors */
	private readonly _errorHandler: IErrorHandler;

	/** The max wait time for a response. */
	private readonly _timeout: number;

	/** The config object. */
	protected readonly config: BrowserRettiwtConfig;

	/** The authentication cookies. */
	private _cookies?: IAuthCookie;

	/**
	 * @param config - The browser config object for configuring the Rettiwt instance.
	 */
	public constructor(config: BrowserRettiwtConfig) {
		LogService.enabled = config.logging ?? false;
		this.config = config;
		this._delay = config.delay;
		this._errorHandler = config.errorHandler ?? new ErrorService();
		this._timeout = config.timeout ?? 0;
		this._auth = new BrowserAuthService(config);
	}

	/**
	 * Sets the authentication cookies for this service.
	 *
	 * @param cookies - The authentication cookies
	 */
	public setCookies(cookies: IAuthCookie): void {
		this._cookies = cookies;
	}

	/**
	 * Checks the authorization status based on the requested resource.
	 *
	 * @param resource - The requested resource.
	 *
	 * @throws An error if not authorized to access the requested resource.
	 */
	private _checkAuthorization(resource: ResourceType): void {
		// Logging
		LogService.log(LogActions.AUTHORIZATION, { authenticated: this.config.userId != undefined });

		// Checking authorization status
		if (!AllowGuestAuthenticationGroup.includes(resource) && this.config.userId == undefined) {
			throw new Error(ApiErrors.RESOURCE_NOT_ALLOWED);
		}
	}

	/**
	 * Returns the AuthCredentials based on cookies or guest authentication.
	 *
	 * @returns The generated AuthCredential
	 */
	protected async _getCredential(): Promise<BrowserAuthCredential> {
		if (this._cookies && this._cookies.auth_token) {
			// Logging
			LogService.log(LogActions.GET, { target: 'USER_CREDENTIAL' });

			return new BrowserAuthCredential(this._cookies);
		} else {
			// Logging
			LogService.log(LogActions.GET, { target: 'NEW_GUEST_CREDENTIAL' });

			return this._auth.guest();
		}
	}

	/**
	 * Generates the header for the transaction ID.
	 * Uses native DOMParser instead of JSDOM.
	 *
	 * @param method - The target method.
	 * @param url - The target URL.
	 *
	 * @returns The header containing the transaction ID.
	 */
	protected async _getTransactionHeader(method: string, url: string): Promise<ITransactionHeader> {
		// Get the X homepage HTML document (using browser-native DOM)
		const document = await this._handleXMigration();

		// Create and initialize ClientTransaction instance
		const transaction = await ClientTransaction.create(document);

		// Getting the URL path excluding all params
		const path = new URL(url).pathname.split('?')[0].trim();

		// Generating the transaction ID
		const tid = await transaction.generateTransactionId(method.toUpperCase(), path);

		return {
			/* eslint-disable @typescript-eslint/naming-convention */
			'x-client-transaction-id': tid,
			/* eslint-enable @typescript-eslint/naming-convention */
		};
	}

	/**
	 * Handles X.com migration using native DOMParser instead of JSDOM.
	 *
	 * @returns The parsed Document
	 */
	protected async _handleXMigration(): Promise<Document> {
		// Fetch X.com homepage
		const homePageResponse = await axios.get<string>('https://x.com', {
			headers: this.config.headers,
		});

		// Parse HTML using native DOMParser
		let document = DomAdapter.parseHTML(homePageResponse.data);

		// Check for migration redirection links
		const migrationRedirectionRegex = new RegExp(
			'(http(?:s)?://(?:www\\.)?(twitter|x){1}\\.com(/x)?/migrate([/?])?tok=[a-zA-Z0-9%\\-_]+)+',
			'i',
		);

		const metaRefresh = document.querySelector("meta[http-equiv='refresh']");
		const metaContent = metaRefresh ? metaRefresh.getAttribute('content') || '' : '';

		const migrationRedirectionUrl =
			migrationRedirectionRegex.exec(metaContent) || migrationRedirectionRegex.exec(homePageResponse.data);

		if (migrationRedirectionUrl) {
			// Follow redirection URL
			const redirectResponse = await axios.get<string>(migrationRedirectionUrl[0]);

			document = DomAdapter.parseHTML(redirectResponse.data);
		}

		// Handle migration form if present
		const migrationForm =
			document.querySelector("form[name='f']") ||
			document.querySelector("form[action='https://x.com/x/migrate']");

		if (migrationForm) {
			const url = migrationForm.getAttribute('action') || 'https://x.com/x/migrate';
			const method = migrationForm.getAttribute('method') || 'POST';

			// Collect form input fields
			const requestPayload = new FormData();

			const inputFields = migrationForm.querySelectorAll('input');
			for (const element of Array.from(inputFields)) {
				const name = element.getAttribute('name');
				const value = element.getAttribute('value');
				if (name && value) {
					requestPayload.append(name, value);
				}
			}

			// Submit form using POST request
			const formResponse = await axios.request<string>({
				method: method,
				url: url,
				data: requestPayload,
				headers: {
					/* eslint-disable @typescript-eslint/naming-convention */

					'Content-Type': 'multipart/form-data',
					...this.config.headers,

					/* eslint-enable @typescript-eslint/naming-convention */
				},
			});

			document = DomAdapter.parseHTML(formResponse.data);
		}

		// Return final DOM document
		return document;
	}

	/**
	 * Validates the given args against the given resource.
	 *
	 * @param resource - The resource against which validation is to be done.
	 * @param args - The args to be validated.
	 *
	 * @returns The validated args.
	 */
	private _validateArgs(resource: ResourceType, args: IFetchArgs | IPostArgs): FetchArgs | PostArgs | undefined {
		if (FetchResourcesGroup.includes(resource)) {
			// Logging
			LogService.log(LogActions.VALIDATE, { target: 'FETCH_ARGS' });

			return new FetchArgs(args);
		} else if (PostResourcesGroup.includes(resource)) {
			// Logging
			LogService.log(LogActions.VALIDATE, { target: 'POST_ARGS' });

			return new PostArgs(args);
		}
	}

	/**
	 * Introduces a delay using the configured delay/delay function.
	 */
	private async _wait(): Promise<void> {
		// If no delay is set, skip
		if (this._delay == undefined) {
			return;
		}

		/** The delay (in ms) to use. */
		let delay = 0;

		// Getting the delay
		if (this._delay && typeof this._delay == 'number') {
			delay = this._delay;
		} else if (this._delay && typeof this._delay == 'function') {
			delay = await this._delay();
		}

		// Awaiting for the delay time
		await new Promise((resolve) => setTimeout(resolve, delay));
	}

	/**
	 * Makes an HTTP request according to the given parameters.
	 *
	 * @param resource - The requested resource.
	 * @param config - The request configuration.
	 *
	 * @typeParam T - The type of the returned response data.
	 *
	 * @returns The raw data response received.
	 */
	public async request<T = unknown>(resource: ResourceType, args: IFetchArgs | IPostArgs): Promise<T> {
		/** The current retry number. */
		let retry = 0;

		/** The error, if any. */
		let error: unknown = undefined;

		// Logging
		LogService.log(LogActions.REQUEST, { resource: resource, args: args });

		// Checking authorization for the requested resource
		this._checkAuthorization(resource);

		// Validating args
		args = this._validateArgs(resource, args)!;

		// Getting credentials from cookies
		const cred: BrowserAuthCredential = await this._getCredential();

		// Getting request configuration
		const config = Requests[resource](args);

		// Setting additional request parameters
		config.headers = {
			...config.headers,
			...cred.toHeader(),
			...this.config.headers,
		};
		// Browser doesn't use httpsAgent
		config.timeout = this._timeout;

		// Using retries for error 404
		do {
			// Sending the request
			try {
				// Getting and appending transaction information
				config.headers = {
					...(await this._getTransactionHeader(config.method ?? '', config.url ?? '')),
					...config.headers,
				};

				// Introducing a delay
				await this._wait();

				// Getting the response body
				const responseData = (await axios<T>(config)).data;

				// Check for Twitter API errors in response body
				// Type guard to check if response contains errors
				const potentialErrorResponse = responseData as unknown as Partial<IErrorData>;
				if (
					potentialErrorResponse.errors &&
					Array.isArray(potentialErrorResponse.errors) &&
					(potentialErrorResponse.data === undefined ||
						JSON.stringify(potentialErrorResponse.data) === JSON.stringify({}))
				) {
					// Throw TwitterError using existing error class
					const axiosError = {
						response: {
							data: { errors: potentialErrorResponse.errors },
							status: 200,
						},
						message: potentialErrorResponse.errors[0]?.message ?? 'Twitter API Error',
						status: 200,
					} as AxiosError<IErrorData>;
					throw new TwitterError(axiosError);
				}

				// Returning the reponse body
				return responseData;
			} catch (err) {
				// If it's an error 404, retry
				if (isAxiosError(err) && err.status === 404) {
					error = err;
					continue;
				}
				// Else, delegate error handling
				else {
					this._errorHandler.handle(err);
				}
			} finally {
				// Incrementing the number of retries done
				retry++;
			}
		} while (retry < this.config.maxRetries);

		/** If request not successful even after retries, throw the error */
		throw error;
	}
}
