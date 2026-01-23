import { Extractors } from '../../collections/Extractors';
import { ResourceType } from '../../enums/Resource';
import { Conversation } from '../../models/data/Conversation';
import { Inbox } from '../../models/data/Inbox';
import { IConversationTimelineResponse } from '../../types/raw/dm/Conversation';
import { IInboxInitialResponse } from '../../types/raw/dm/InboxInitial';
import { IInboxTimelineResponse } from '../../types/raw/dm/InboxTimeline';

import { BrowserFetcherService } from './BrowserFetcherService';
import { BrowserRettiwtConfig } from '../config/BrowserRettiwtConfig';

/**
 * Browser-compatible direct message service.
 * Handles interacting with resources related to direct messages.
 *
 * @public
 */
export class BrowserDirectMessageService extends BrowserFetcherService {
	/**
	 * @param config - The browser config object for configuring the Rettiwt instance.
	 */
	public constructor(config: BrowserRettiwtConfig) {
		super(config);
	}

	/**
	 * Get the full conversation history for a specific conversation.
	 *
	 * @param conversationId - The ID of the conversation.
	 * @param cursor - The cursor for pagination.
	 * @returns The conversation with full message history.
	 */
	public async conversation(conversationId: string, cursor?: string): Promise<Conversation | undefined> {
		const resource = ResourceType.DM_CONVERSATION;

		const response = await this.request<IConversationTimelineResponse>(resource, {
			id: conversationId,
			cursor: cursor,
		});

		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Get the inbox with recent conversations.
	 *
	 * @returns The inbox containing conversations.
	 */
	public async inbox(): Promise<Inbox | undefined> {
		const resource = ResourceType.DM_INBOX_INITIAL_STATE;

		const response = await this.request<IInboxInitialResponse>(resource, {});

		const data = Extractors[resource](response);

		return data;
	}

	/**
	 * Get more conversations from the inbox timeline.
	 *
	 * @param cursor - The cursor for pagination.
	 * @returns The inbox timeline with more conversations.
	 */
	public async inboxTimeline(cursor: string): Promise<Inbox | undefined> {
		const resource = ResourceType.DM_INBOX_TIMELINE;

		const response = await this.request<IInboxTimelineResponse>(resource, {
			cursor: cursor,
		});

		const data = Extractors[resource](response);

		return data;
	}
}
