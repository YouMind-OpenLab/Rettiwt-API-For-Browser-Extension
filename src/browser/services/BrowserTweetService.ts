import { Extractors } from '../../collections/Extractors';
import { ResourceType } from '../../enums/Resource';
import { TweetRepliesSortType } from '../../enums/Tweet';
import { CursoredData } from '../../models/data/CursoredData';
import { Tweet } from '../../models/data/Tweet';
import { User } from '../../models/data/User';

import { ITweetFilter } from '../../types/args/FetchArgs';
import { INewTweet } from '../../types/args/PostArgs';
import { IMediaInitializeUploadResponse } from '../../types/raw/media/InitalizeUpload';

import { ITweetBookmarkResponse } from '../../types/raw/tweet/Bookmark';
import { ITweetDetailsResponse } from '../../types/raw/tweet/Details';
import { ITweetDetailsBulkResponse } from '../../types/raw/tweet/DetailsBulk';
import { ITweetLikeResponse } from '../../types/raw/tweet/Like';
import { ITweetLikersResponse } from '../../types/raw/tweet/Likers';
import { ITweetPostResponse } from '../../types/raw/tweet/Post';
import { ITweetRepliesResponse } from '../../types/raw/tweet/Replies';
import { ITweetRetweetResponse } from '../../types/raw/tweet/Retweet';
import { ITweetRetweetersResponse } from '../../types/raw/tweet/Retweeters';
import { ITweetScheduleResponse } from '../../types/raw/tweet/Schedule';
import { ITweetSearchResponse } from '../../types/raw/tweet/Search';
import { ITweetUnbookmarkResponse } from '../../types/raw/tweet/Unbookmark';
import { ITweetUnlikeResponse } from '../../types/raw/tweet/Unlike';
import { ITweetUnpostResponse } from '../../types/raw/tweet/Unpost';
import { ITweetUnretweetResponse } from '../../types/raw/tweet/Unretweet';
import { ITweetUnscheduleResponse } from '../../types/raw/tweet/Unschedule';

import { BrowserFetcherService } from './BrowserFetcherService';
import { BrowserRettiwtConfig } from '../config/BrowserRettiwtConfig';

/**
 * Browser media type - accepts Blob, File, or ArrayBuffer.
 */
export type BrowserMedia = Blob | File | ArrayBuffer;

/**
 * Browser-compatible tweet service.
 * Handles interacting with resources related to tweets.
 * Uses Blob/File API instead of fs for media uploads.
 *
 * @public
 */
export class BrowserTweetService extends BrowserFetcherService {
	/**
	 * @param config - The browser config object for configuring the Rettiwt instance.
	 */
	public constructor(config: BrowserRettiwtConfig) {
		super(config);
	}

	/**
	 * Bookmark a tweet.
	 *
	 * @param id - The ID of the tweet to be bookmarked.
	 * @returns Whether bookmarking was successful or not.
	 */
	public async bookmark(id: string): Promise<boolean> {
		const resource = ResourceType.TWEET_BOOKMARK;

		const response = await this.request<ITweetBookmarkResponse>(resource, {
			id: id,
		});

		const data = Extractors[resource](response) ?? false;

		return data;
	}

	/**
	 * Get the details of a tweet.
	 *
	 * @param id - The ID of the target tweet.
	 * @returns The details of the tweet with the given ID.
	 */
	public async details(id: string): Promise<Tweet | undefined>;

	/**
	 * Get the details of multiple tweets.
	 *
	 * @param ids - The IDs of the target tweets.
	 * @returns The list of tweet details.
	 */
	public async details(ids: string[]): Promise<Tweet[]>;

	public async details(id: string | string[]): Promise<Tweet | Tweet[] | undefined> {
		// If single ID
		if (typeof id === 'string') {
			const resource = ResourceType.TWEET_DETAILS;

			const response = await this.request<ITweetDetailsResponse>(resource, {
				id: id,
			});

			const data = Extractors[resource](response, id);

			return data;
		}
		// If multiple IDs
		else {
			const resource = ResourceType.TWEET_DETAILS_BULK;

			const response = await this.request<ITweetDetailsBulkResponse>(resource, {
				ids: id,
			});

			const data = Extractors[resource](response, id);

			return data;
		}
	}

	/**
	 * Like a tweet.
	 *
	 * @param id - The ID of the tweet to be liked.
	 * @returns Whether liking was successful or not.
	 */
	public async like(id: string): Promise<boolean> {
		const resource = ResourceType.TWEET_LIKE;

		const response = await this.request<ITweetLikeResponse>(resource, {
			id: id,
		});

		const data = Extractors[resource](response) ?? false;

		return data;
	}

	/**
	 * Get the list of users who liked a tweet.
	 *
	 * @param id - The ID of the target tweet.
	 * @param count - The number of likers to fetch, must be <= 100.
	 * @param cursor - The cursor to the batch of likers to fetch.
	 * @returns The list of users who liked the target tweet.
	 */
	public async likers(id: string, count?: number, cursor?: string): Promise<CursoredData<User>> {
		const resource = ResourceType.TWEET_LIKERS;

		const response = await this.request<ITweetLikersResponse>(resource, {
			id: id,
			count: count,
			cursor: cursor,
		});

		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Post a new tweet.
	 *
	 * @param tweet - The tweet to be posted.
	 * @returns The ID of the posted tweet, or undefined if posting failed.
	 */
	public async post(tweet: INewTweet): Promise<string | undefined> {
		const resource = ResourceType.TWEET_POST;

		const response = await this.request<ITweetPostResponse>(resource, {
			tweet: tweet,
		});

		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Get the replies to a tweet.
	 *
	 * @param id - The ID of the target tweet.
	 * @param cursor - The cursor to the batch of replies to fetch.
	 * @param sortBy - The type of sorting for the replies.
	 * @returns The list of replies to the target tweet.
	 */
	public async replies(
		id: string,
		cursor?: string,
		sortBy?: TweetRepliesSortType,
	): Promise<CursoredData<Tweet>> {
		const resource = ResourceType.TWEET_REPLIES;

		const response = await this.request<ITweetDetailsResponse>(resource, {
			id: id,
			cursor: cursor,
			sortBy: sortBy,
		});

		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Retweet a tweet.
	 *
	 * @param id - The ID of the tweet to be retweeted.
	 * @returns Whether retweeting was successful or not.
	 */
	public async retweet(id: string): Promise<boolean> {
		const resource = ResourceType.TWEET_RETWEET;

		const response = await this.request<ITweetRetweetResponse>(resource, {
			id: id,
		});

		const data = Extractors[resource](response) ?? false;

		return data;
	}

	/**
	 * Get the list of users who retweeted a tweet.
	 *
	 * @param id - The ID of the target tweet.
	 * @param count - The number of retweeters to fetch, must be <= 100.
	 * @param cursor - The cursor to the batch of retweeters to fetch.
	 * @returns The list of users who retweeted the target tweet.
	 */
	public async retweeters(id: string, count?: number, cursor?: string): Promise<CursoredData<User>> {
		const resource = ResourceType.TWEET_RETWEETERS;

		const response = await this.request<ITweetRetweetersResponse>(resource, {
			id: id,
			count: count,
			cursor: cursor,
		});

		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Search for tweets.
	 *
	 * @param filter - The filter for searching tweets.
	 * @param count - The number of tweets to fetch, must be <= 100.
	 * @param cursor - The cursor to the batch of tweets to fetch.
	 * @returns The list of tweets matching the given filter.
	 */
	public async search(filter: ITweetFilter, count?: number, cursor?: string): Promise<CursoredData<Tweet>> {
		const resource = ResourceType.TWEET_SEARCH;

		const response = await this.request<ITweetSearchResponse>(resource, {
			filter: filter,
			count: count,
			cursor: cursor,
		});

		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Unbookmark a tweet.
	 *
	 * @param id - The ID of the tweet to be unbookmarked.
	 * @returns Whether unbookmarking was successful or not.
	 */
	public async unbookmark(id: string): Promise<boolean> {
		const resource = ResourceType.TWEET_UNBOOKMARK;

		const response = await this.request<ITweetUnbookmarkResponse>(resource, {
			id: id,
		});

		const data = Extractors[resource](response) ?? false;

		return data;
	}

	/**
	 * Unlike a tweet.
	 *
	 * @param id - The ID of the tweet to be unliked.
	 * @returns Whether unliking was successful or not.
	 */
	public async unlike(id: string): Promise<boolean> {
		const resource = ResourceType.TWEET_UNLIKE;

		const response = await this.request<ITweetUnlikeResponse>(resource, {
			id: id,
		});

		const data = Extractors[resource](response) ?? false;

		return data;
	}

	/**
	 * Unpost (delete) a tweet.
	 *
	 * @param id - The ID of the tweet to be unposted.
	 * @returns Whether unposting was successful or not.
	 */
	public async unpost(id: string): Promise<boolean> {
		const resource = ResourceType.TWEET_UNPOST;

		const response = await this.request<ITweetUnpostResponse>(resource, {
			id: id,
		});

		const data = Extractors[resource](response) ?? false;

		return data;
	}

	/**
	 * Unretweet a tweet.
	 *
	 * @param id - The ID of the tweet to be unretweeted.
	 * @returns Whether unretweeting was successful or not.
	 */
	public async unretweet(id: string): Promise<boolean> {
		const resource = ResourceType.TWEET_UNRETWEET;

		const response = await this.request<ITweetUnretweetResponse>(resource, {
			id: id,
		});

		const data = Extractors[resource](response) ?? false;

		return data;
	}

	/**
	 * Upload media for use in tweets.
	 * Uses browser-native Blob/File API instead of fs.
	 *
	 * @param media - The media to upload (Blob, File, or ArrayBuffer).
	 * @returns The media ID string for use in tweet posts.
	 */
	public async upload(media: BrowserMedia): Promise<string> {
		// Get size from Blob/File/ArrayBuffer
		const size = media instanceof ArrayBuffer ? media.byteLength : media.size;

		// INITIALIZE
		const id: string = (
			await this.request<IMediaInitializeUploadResponse>(ResourceType.MEDIA_UPLOAD_INITIALIZE, {
				upload: { size: size },
			})
		).media_id_string;

		// APPEND - convert ArrayBuffer to Blob if needed
		// Note: We need to convert Blob to ArrayBuffer for the request
		const arrayBuffer = media instanceof ArrayBuffer ? media : await media.arrayBuffer();
		await this.request(ResourceType.MEDIA_UPLOAD_APPEND, {
			upload: { id: id, media: arrayBuffer },
		});

		// FINALIZE
		await this.request(ResourceType.MEDIA_UPLOAD_FINALIZE, { upload: { id: id } });

		return id;
	}
}
