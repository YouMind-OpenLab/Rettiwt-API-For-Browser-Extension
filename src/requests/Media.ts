import fs from 'fs';

import { AxiosRequestConfig } from 'axios';
import FormData from 'form-data';

/**
 * Collection of requests related to media.
 *
 * @public
 */
export class MediaRequests {
	/**
	 * @param id - The allocated id of the media item to be uploaded.
	 * @param media - The media item to upload. Can be a file path (Node.js), ArrayBuffer, or Blob (browser).
	 */
	public static appendUpload(id: string, media: string | ArrayBuffer | Blob): AxiosRequestConfig {
		const data = new FormData();
		// Support different media types:
		// - string: file path (Node.js only, uses fs.createReadStream)
		// - Blob/File: browser native blob (pass directly)
		// - ArrayBuffer: convert to Buffer (Node.js) or pass as-is (browser)
		if (typeof media === 'string') {
			data.append('media', fs.createReadStream(media));
		} else if (media instanceof Blob) {
			data.append('media', media);
		} else {
			data.append('media', Buffer.from(media));
		}
		return {
			method: 'post',
			headers: { referer: 'https://x.com' },
			url: 'https://upload.x.com/i/media/upload.json',
			params: {
				/* eslint-disable @typescript-eslint/naming-convention */
				command: 'APPEND',
				media_id: id,
				segment_index: 0,
				/* eslint-enable @typescript-eslint/naming-convention */
			},
			data: data,
		};
	}

	/**
	 * @param id - The allocated id of the media item.
	 */
	public static finalizeUpload(id: string): AxiosRequestConfig {
		return {
			method: 'post',
			headers: { referer: 'https://x.com' },
			url: 'https://upload.x.com/i/media/upload.json',
			params: {
				/* eslint-disable @typescript-eslint/naming-convention */
				command: 'FINALIZE',
				media_id: id,
				/* eslint-enable @typescript-eslint/naming-convention */
			},
		};
	}

	/**
	 * @param size - The size (in bytes) of the media item to be uploaded.
	 */
	public static initializeUpload(size: number): AxiosRequestConfig {
		return {
			method: 'post',
			headers: { referer: 'https://x.com' },
			url: 'https://upload.x.com/i/media/upload.json',
			params: {
				/* eslint-disable @typescript-eslint/naming-convention */
				command: 'INIT',
				total_bytes: size,
				/* eslint-enable @typescript-eslint/naming-convention */
			},
		};
	}
}
