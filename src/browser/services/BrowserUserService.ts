import { Extractors } from '../../collections/Extractors';
import { RawAnalyticsGranularity, RawAnalyticsMetric } from '../../enums/raw/Analytics';
import { ResourceType } from '../../enums/Resource';
import { ProfileUpdateOptions } from '../../models/args/ProfileArgs';
import { Analytics } from '../../models/data/Analytics';
import { BookmarkFolder } from '../../models/data/BookmarkFolder';
import { CursoredData } from '../../models/data/CursoredData';
import { List } from '../../models/data/List';
import { Notification } from '../../models/data/Notification';
import { Tweet } from '../../models/data/Tweet';
import { User } from '../../models/data/User';
import { IProfileUpdateOptions } from '../../types/args/ProfileArgs';
import { IUserAffiliatesResponse } from '../../types/raw/user/Affiliates';
import { IUserAnalyticsResponse } from '../../types/raw/user/Analytics';
import { IUserBookmarkFoldersResponse } from '../../types/raw/user/BookmarkFolders';
import { IUserBookmarkFolderTweetsResponse } from '../../types/raw/user/BookmarkFolderTweets';
import { IUserBookmarksResponse } from '../../types/raw/user/Bookmarks';
import { IUserDetailsResponse } from '../../types/raw/user/Details';
import { IUserDetailsBulkResponse } from '../../types/raw/user/DetailsBulk';
import { IUserFollowResponse } from '../../types/raw/user/Follow';
import { IUserFollowedResponse } from '../../types/raw/user/Followed';
import { IUserFollowersResponse } from '../../types/raw/user/Followers';
import { IUserFollowingResponse } from '../../types/raw/user/Following';
import { IUserHighlightsResponse } from '../../types/raw/user/Highlights';
import { IUserLikesResponse } from '../../types/raw/user/Likes';
import { IUserListsResponse } from '../../types/raw/user/Lists';
import { IUserMediaResponse } from '../../types/raw/user/Media';
import { IUserNotificationsResponse } from '../../types/raw/user/Notifications';
import { IUserProfileUpdateResponse } from '../../types/raw/user/ProfileUpdate';
import { IUserRecommendedResponse } from '../../types/raw/user/Recommended';
import { IUserSearchResponse } from '../../types/raw/user/Search';
import { IUserSubscriptionsResponse } from '../../types/raw/user/Subscriptions';
import { IUserTweetsResponse } from '../../types/raw/user/Tweets';
import { IUserTweetsAndRepliesResponse } from '../../types/raw/user/TweetsAndReplies';
import { IUserUnfollowResponse } from '../../types/raw/user/Unfollow';

import { BrowserFetcherService } from './BrowserFetcherService';
import { BrowserRettiwtConfig } from '../config/BrowserRettiwtConfig';

/**
 * Browser-compatible user service.
 * Handles interacting with resources related to user account.
 *
 * @public
 */
export class BrowserUserService extends BrowserFetcherService {
	/**
	 * @param config - The browser config object for configuring the Rettiwt instance.
	 */
	public constructor(config: BrowserRettiwtConfig) {
		super(config);
	}

	/**
	 * Get the details of the currently logged in user.
	 *
	 * @returns The details of the logged in user.
	 */
	public async details(): Promise<User | undefined> {
		const resource = ResourceType.USER_DETAILS_BY_ID;

		const response = await this.request<IUserDetailsResponse>(resource, {
			id: this.config.userId,
		});

		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Get the details of a user by username.
	 *
	 * @param id - The username of the target user.
	 * @returns The details of the user.
	 */
	public async detailsByUserName(id: string): Promise<User | undefined> {
		const resource = ResourceType.USER_DETAILS_BY_USERNAME;

		const response = await this.request<IUserDetailsResponse>(resource, {
			id: id,
		});

		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Get the details of a user by ID.
	 *
	 * @param id - The ID of the target user.
	 * @returns The details of the user.
	 */
	public async detailsById(id: string): Promise<User | undefined> {
		const resource = ResourceType.USER_DETAILS_BY_ID;

		const response = await this.request<IUserDetailsResponse>(resource, {
			id: id,
		});

		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Get the list of users following a user.
	 *
	 * @param id - The ID of the target user.
	 * @param count - The number of followers to fetch, must be <= 100.
	 * @param cursor - The cursor to the batch of followers to fetch.
	 * @returns The list of users following the target user.
	 */
	public async followers(id: string, count?: number, cursor?: string): Promise<CursoredData<User>> {
		const resource = ResourceType.USER_FOLLOWERS;

		const response = await this.request<IUserFollowersResponse>(resource, {
			id: id,
			count: count,
			cursor: cursor,
		});

		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Get the list of users followed by a user.
	 *
	 * @param id - The ID of the target user.
	 * @param count - The number of following to fetch, must be <= 100.
	 * @param cursor - The cursor to the batch of following to fetch.
	 * @returns The list of users followed by the target user.
	 */
	public async following(id: string, count?: number, cursor?: string): Promise<CursoredData<User>> {
		const resource = ResourceType.USER_FOLLOWING;

		const response = await this.request<IUserFollowingResponse>(resource, {
			id: id,
			count: count,
			cursor: cursor,
		});

		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Get the list of tweets liked by a user.
	 *
	 * @param id - The ID of the target user.
	 * @param count - The number of likes to fetch, must be <= 100.
	 * @param cursor - The cursor to the batch of likes to fetch.
	 * @returns The list of tweets liked by the target user.
	 */
	public async likes(id: string, count?: number, cursor?: string): Promise<CursoredData<Tweet>> {
		const resource = ResourceType.USER_LIKES;

		const response = await this.request<IUserLikesResponse>(resource, {
			id: id,
			count: count,
			cursor: cursor,
		});

		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Get the timeline of a user.
	 *
	 * @param id - The ID of the target user.
	 * @param count - The number of tweets to fetch, must be <= 100.
	 * @param cursor - The cursor to the batch of tweets to fetch.
	 * @returns The timeline of the target user.
	 */
	public async timeline(id: string, count?: number, cursor?: string): Promise<CursoredData<Tweet>> {
		const resource = ResourceType.USER_TIMELINE;

		const response = await this.request<IUserTweetsResponse>(resource, {
			id: id,
			count: count,
			cursor: cursor,
		});

		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Follow a user.
	 *
	 * @param id - The ID of the user to follow.
	 * @returns Whether the follow was successful.
	 */
	public async follow(id: string): Promise<boolean> {
		const resource = ResourceType.USER_FOLLOW;

		const response = await this.request<IUserFollowResponse>(resource, {
			id: id,
		});

		const data = Extractors[resource](response) ?? false;

		return data;
	}

	/**
	 * Unfollow a user.
	 *
	 * @param id - The ID of the user to unfollow.
	 * @returns Whether the unfollow was successful.
	 */
	public async unfollow(id: string): Promise<boolean> {
		const resource = ResourceType.USER_UNFOLLOW;

		const response = await this.request<IUserUnfollowResponse>(resource, {
			id: id,
		});

		const data = Extractors[resource](response) ?? false;

		return data;
	}

	/**
	 * Search for users.
	 *
	 * @param query - The search query.
	 * @param count - The number of users to fetch.
	 * @param cursor - The cursor for pagination.
	 * @returns The list of users matching the query.
	 */
	public async search(userName: string, count?: number, cursor?: string): Promise<CursoredData<User>> {
		const resource = ResourceType.USER_SEARCH;

		const response = await this.request<IUserSearchResponse>(resource, {
			id: userName,
			count: count,
			cursor: cursor,
		});

		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Get the bookmarks of the logged in user.
	 *
	 * @param count - The number of bookmarks to fetch, must be <= 100.
	 * @param cursor - The cursor to the batch of bookmarks to fetch.
	 * @returns The list of bookmarked tweets.
	 */
	public async bookmarks(count?: number, cursor?: string): Promise<CursoredData<Tweet>> {
		const resource = ResourceType.USER_BOOKMARKS;

		const response = await this.request<IUserBookmarksResponse>(resource, {
			count: count,
			cursor: cursor,
		});

		const data = Extractors[resource](response);

		return data;
	}
}
