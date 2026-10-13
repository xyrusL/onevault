import { apiRequest } from '../../../shared/services/api-client.service';
import {
  MailActivityItem,
  MailInboxMessageDetail,
  MailInboxMessageSummary,
} from '../types/mail-inbox.types';
import { NO_FORWARD } from '../types/mail.types';

interface MailMessageSummaryDto {
  id: string;
  mailAccountId: string;
  recipientEmail: string;
  sender: string;
  senderName: string;
  subject: string;
  snippet: string;
  isRead: boolean;
  receivedAt: string;
}

interface MailMessageDetailDto extends MailMessageSummaryDto {
  textBody: string | null;
  htmlBody: string | null;
  rawMime: string;
}

interface MailActivityDto extends MailMessageSummaryDto {
  forwardTo: string | null;
}

const listCache = new Map<string, MailInboxMessageSummary[]>();
const detailCache = new Map<string, MailInboxMessageDetail>();
let activityCache: MailActivityItem[] | null = null;

function toSummary(dto: MailMessageSummaryDto): MailInboxMessageSummary {
  const dt = new Date(dto.receivedAt);
  return {
    id: dto.id,
    mailAccountId: dto.mailAccountId,
    recipientEmail: dto.recipientEmail,
    sender: dto.sender,
    senderName: dto.senderName,
    subject: dto.subject,
    snippet: dto.snippet,
    isRead: dto.isRead,
    receivedAt: dto.receivedAt,
    receivedDate: dt.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }),
    receivedTime: dt.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  };
}

function toDetail(dto: MailMessageDetailDto): MailInboxMessageDetail {
  return {
    ...toSummary(dto),
    textBody: dto.textBody,
    htmlBody: dto.htmlBody,
    rawMime: dto.rawMime,
  };
}

function toActivityItem(dto: MailActivityDto): MailActivityItem {
  return {
    ...toSummary(dto),
    forwardTo: !dto.forwardTo || dto.forwardTo === 'None' ? NO_FORWARD : dto.forwardTo,
  };
}

export const mailInboxService = {
  getCachedList(accountId: string): MailInboxMessageSummary[] | null {
    return listCache.get(accountId) ?? null;
  },

  getCachedDetail(messageId: string): MailInboxMessageDetail | null {
    return detailCache.get(messageId) ?? null;
  },

  getCachedActivity(): MailActivityItem[] | null {
    return activityCache;
  },

  async listActivity(): Promise<MailActivityItem[]> {
    const rows = await apiRequest<MailActivityDto[]>('/mail-inbox/activity');
    const items = rows.map(toActivityItem);
    activityCache = items;
    return items;
  },

  async markActivityRead(messageId: string): Promise<void> {
    if (activityCache) {
      activityCache = activityCache.map((item) =>
        item.id === messageId ? { ...item, isRead: true } : item
      );
    }
    await apiRequest<{ ok: boolean }>(
      `/mail-inbox/activity/${messageId}/read`,
      { method: 'PATCH' }
    );
  },

  async markAllActivityRead(): Promise<void> {
    if (activityCache) {
      activityCache = activityCache.map((item) => ({ ...item, isRead: true }));
    }
    for (const [accountId, list] of listCache.entries()) {
      listCache.set(
        accountId,
        list.map((m) => ({ ...m, isRead: true }))
      );
    }
    await apiRequest<{ ok: boolean }>('/mail-inbox/activity/read-all', {
      method: 'POST',
    });
  },

  async listMessages(accountId: string): Promise<MailInboxMessageSummary[]> {
    const rows = await apiRequest<MailMessageSummaryDto[]>(
      `/mail-inbox/${accountId}`
    );
    const items = rows.map(toSummary);
    listCache.set(accountId, items);
    return items;
  },

  async getMessageDetail(
    accountId: string,
    messageId: string
  ): Promise<MailInboxMessageDetail> {
    const dto = await apiRequest<MailMessageDetailDto>(
      `/mail-inbox/${accountId}/messages/${messageId}`
    );
    const detail = toDetail(dto);
    detailCache.set(messageId, detail);

    const existingList = listCache.get(accountId);
    if (existingList) {
      listCache.set(
        accountId,
        existingList.map((m) => (m.id === messageId ? { ...m, isRead: true } : m))
      );
    }
    if (activityCache) {
      activityCache = activityCache.map((item) =>
        item.id === messageId ? { ...item, isRead: true } : item
      );
    }
    return detail;
  },

  async deleteMessage(accountId: string, messageId: string): Promise<void> {
    await apiRequest<void>(`/mail-inbox/${accountId}/messages/${messageId}`, {
      method: 'DELETE',
    });
    detailCache.delete(messageId);
    const existingList = listCache.get(accountId);
    if (existingList) {
      listCache.set(
        accountId,
        existingList.filter((m) => m.id !== messageId)
      );
    }
    if (activityCache) {
      activityCache = activityCache.filter((item) => item.id !== messageId);
    }
  },
};
