export type MailInboxRenderMode = 'formatted' | 'text' | 'raw';

export interface MailInboxMessageSummary {
  id: string;
  mailAccountId: string;
  recipientEmail: string;
  sender: string;
  senderName: string;
  subject: string;
  snippet: string;
  isRead: boolean;
  receivedDate: string;
  receivedTime: string;
  receivedAt: string;
}

export interface MailInboxMessageDetail extends MailInboxMessageSummary {
  textBody: string | null;
  htmlBody: string | null;
  rawMime: string;
}

export interface MailActivityItem {
  id: string;
  mailAccountId: string;
  recipientEmail: string;
  sender: string;
  senderName: string;
  subject: string;
  snippet: string;
  isRead: boolean;
  receivedDate: string;
  receivedTime: string;
  receivedAt: string;
  /** 'None' when stored in D1 Inbox, or the destination email when forwarded */
  forwardTo: string;
}
