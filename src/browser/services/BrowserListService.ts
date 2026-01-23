import { Extractors } from '../../collections/Extractors';
import { ResourceType } from '../../enums/Resource';
import { CursoredData } from '../../models/data/CursoredData';
import { List } from '../../models/data/List';
import { Tweet } from '../../models/data/Tweet';
import { User } from '../../models/data/User';
import { IListMemberAddResponse } from '../../types/raw/list/AddMember';
import { IListDetailsResponse } from '../../types/raw/list/Details';
import { IListMembersResponse } from '../../types/raw/list/Members';
import { IListMemberRemoveResponse } from '../../types/raw/list/RemoveMember';
import { IListTweetsResponse } from '../../types/raw/list/Tweets';

import { BrowserFetcherService } from './BrowserFetcherService';
import { BrowserRettiwtConfig } from '../config/BrowserRettiwtConfig';

/**
 * Browser-compatible list service.
 * Handles interacting with resources related to lists.
 *
 * @public
 */
export class BrowserListService extends BrowserFetcherService {
	/**
	 * @param config - The browser config object for configuring the Rettiwt instance.
	 */
	public constructor(config: BrowserRettiwtConfig) {
		super(config);
	}

	/**
	 * Add a user as a member of a list.
	 *
	 * @param listId - The ID of the target list.
	 * @param userId - The ID of the target user to be added as a member.
	 * @returns The new member count of the list. If adding was unsuccessful, return `undefined`.
	 */
	public async addMember(listId: string, userId: string): Promise<number | undefined> {
		const resource = ResourceType.LIST_MEMBER_ADD;

		const response = await this.request<IListMemberAddResponse>(resource, {
			id: listId,
			userId: userId,
		});

		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Get the details of a list.
	 *
	 * @param id - The ID of the target list.
	 * @returns The details of the list.
	 */
	public async details(id: string): Promise<List | undefined> {
		const resource = ResourceType.LIST_DETAILS;

		const response = await this.request<IListDetailsResponse>(resource, {
			id: id,
		});

		const data = Extractors[resource](response, id);

		return data;
	}

	/**
	 * Get the members of a list.
	 *
	 * @param id - The ID of the target list.
	 * @param count - The number of members to fetch, must be <= 100.
	 * @param cursor - The cursor to the batch of members to fetch.
	 * @returns The list of members of the target list.
	 */
	public async members(id: string, count?: number, cursor?: string): Promise<CursoredData<User>> {
		const resource = ResourceType.LIST_MEMBERS;

		const response = await this.request<IListMembersResponse>(resource, {
			id: id,
			count: count,
			cursor: cursor,
		});

		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Remove a user from a list.
	 *
	 * @param listId - The ID of the target list.
	 * @param userId - The ID of the target user to be removed.
	 * @returns The new member count of the list. If removal was unsuccessful, return `undefined`.
	 */
	public async removeMember(listId: string, userId: string): Promise<number | undefined> {
		const resource = ResourceType.LIST_MEMBER_REMOVE;

		const response = await this.request<IListMemberRemoveResponse>(resource, {
			id: listId,
			userId: userId,
		});

		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Get the tweets from a list.
	 *
	 * @param id - The ID of the target list.
	 * @param count - The number of tweets to fetch, must be <= 100.
	 * @param cursor - The cursor to the batch of tweets to fetch.
	 * @returns The list of tweets from the target list.
	 */
	public async tweets(id: string, count?: number, cursor?: string): Promise<CursoredData<Tweet>> {
		const resource = ResourceType.LIST_TWEETS;

		const response = await this.request<IListTweetsResponse>(resource, {
			id: id,
			count: count,
			cursor: cursor,
		});

		const data = Extractors[resource](response);

		return data;
	}
}
