import { LogService } from '../../services/internal/LogService';
import { LogActions } from '../../enums/Logging';

/**
 * Dynamically resolves Twitter GraphQL query IDs by fetching and parsing
 * the main JS bundle from x.com.
 *
 * Twitter periodically rotates these IDs, so hardcoding them causes breakage.
 * This resolver fetches the current IDs at runtime and caches them.
 *
 * @public
 */
export class GraphQLQueryIdResolver {
	private _cache: Map<string, string> = new Map();
	private _lastFetchTime: number = 0;
	private _ttlMs: number;
	private _fetching: Promise<void> | null = null;

	constructor(ttlMs: number = 3600000) {
		this._ttlMs = ttlMs;
	}

	/** Check if cache is still valid */
	private _isCacheValid(): boolean {
		return this._cache.size > 0 && Date.now() - this._lastFetchTime < this._ttlMs;
	}

	/**
	 * Resolve query IDs from a Document (x.com homepage).
	 * Finds the main JS bundle URL from script tags, fetches it,
	 * and extracts all queryId/operationName pairs.
	 */
	async resolve(document: Document): Promise<void> {
		if (this._fetching) {
			await this._fetching;
			return;
		}
		if (this._isCacheValid()) return;

		this._fetching = this._doResolve(document);
		try {
			await this._fetching;
		} finally {
			this._fetching = null;
		}
	}

	private async _doResolve(document: Document): Promise<void> {
		try {
			// 1. Find main.*.js bundle URL from script tags
			const scripts = document.querySelectorAll('script[src]');
			let mainBundleUrl: string | null = null;
			for (const script of Array.from(scripts)) {
				const src = script.getAttribute('src');
				if (src && /\/main\.[a-f0-9]+\.js/.test(src)) {
					mainBundleUrl = src;
					break;
				}
			}
			if (!mainBundleUrl) {
				LogService.log(LogActions.WARNING, { message: 'GraphQL resolver: main bundle not found in document' });
				return;
			}

			// 2. Fetch the bundle using browser-native fetch
			const response = await fetch(mainBundleUrl);
			const bundleText = await response.text();

			// 3. Extract all queryId/operationName pairs
			const regex = /queryId:"([^"]+)",operationName:"([^"]+)"/g;
			let match;
			const newCache = new Map<string, string>();
			while ((match = regex.exec(bundleText)) !== null) {
				newCache.set(match[2], match[1]); // operationName → queryId
			}

			// 4. Only update if we found entries
			if (newCache.size > 0) {
				this._cache = newCache;
				this._lastFetchTime = Date.now();
				LogService.log(LogActions.GET, {
					target: 'GRAPHQL_QUERY_IDS',
					count: newCache.size,
				});
			} else {
				LogService.log(LogActions.WARNING, {
					message: 'GraphQL resolver: no queryId/operationName pairs found in bundle',
				});
			}
		} catch (err) {
			LogService.log(LogActions.WARNING, {
				message: `GraphQL resolver failed: ${err instanceof Error ? err.message : String(err)}`,
			});
			// Silently fail — hardcoded IDs remain as fallback
		}
	}

	/**
	 * Get the current query ID for an operation name.
	 * Returns undefined if not resolved yet.
	 */
	getQueryId(operationName: string): string | undefined {
		return this._cache.get(operationName);
	}

	/** Invalidate the cache (e.g., on auth errors that suggest ID rotation) */
	invalidate(): void {
		this._lastFetchTime = 0;
	}

	/** Whether we have resolved IDs */
	get hasResolved(): boolean {
		return this._cache.size > 0;
	}
}
