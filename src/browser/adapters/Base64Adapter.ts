/**
 * Browser-compatible base64 encoding/decoding.
 * Replaces Node.js Buffer for base64 operations.
 *
 * @internal
 */
export class Base64Adapter {
	/**
	 * Decodes a base64 string to ASCII.
	 * Equivalent to: Buffer.from(encoded, 'base64').toString('ascii')
	 *
	 * @param encoded - The base64 encoded string
	 * @returns The decoded ASCII string
	 */
	static decode(encoded: string): string {
		return atob(encoded);
	}

	/**
	 * Encodes a string to base64.
	 * Equivalent to: Buffer.from(data).toString('base64')
	 *
	 * @param data - The string to encode
	 * @returns The base64 encoded string
	 */
	static encode(data: string): string {
		return btoa(data);
	}
}
