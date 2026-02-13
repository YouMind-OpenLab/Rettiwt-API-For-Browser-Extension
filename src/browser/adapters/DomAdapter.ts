// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - linkedom types are incompatible with DOM types but work at runtime
import { parseHTML as linkedomParseHTML } from 'linkedom';

/**
 * DOM parsing adapter for browser environments.
 * Uses linkedom for compatibility with both popup and service worker (background) contexts.
 * DOMParser is not available in service workers, so we use linkedom which works everywhere.
 *
 * @internal
 */
export class DomAdapter {
	/**
	 * Parses an HTML string into a Document.
	 * Equivalent to: new JSDOM(html).window.document
	 *
	 * @param html - The HTML string to parse
	 * @returns The parsed Document
	 */
	static parseHTML(html: string): Document {
		// Use linkedom for service worker compatibility
		// linkedom works in all JS environments (popup, content script, service worker)
		const { document } = linkedomParseHTML(html);
		return document as unknown as Document;
	}
}
