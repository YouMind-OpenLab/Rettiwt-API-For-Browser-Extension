/**
 * Browser-native DOM parsing.
 * Replaces JSDOM with native DOMParser for browser environments.
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
		const parser = new DOMParser();
		return parser.parseFromString(html, 'text/html');
	}
}
