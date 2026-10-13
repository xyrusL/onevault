export interface MailMessageRecord {
  id: string;
  mail_account_id: string;
  recipient_email: string;
  sender: string;
  sender_name: string;
  subject: string;
  snippet: string;
  text_body: string | null;
  html_body: string | null;
  raw_mime: string;
  is_read: number;
  received_at: string;
}

export interface MailMessageSummaryDto {
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

export interface MailMessageDetailDto extends MailMessageSummaryDto {
  textBody: string | null;
  htmlBody: string | null;
  rawMime: string;
}

export interface MailActivityRecord {
  id: string;
  mail_account_id: string;
  recipient_email: string;
  sender: string;
  sender_name: string;
  subject: string;
  snippet: string;
  is_read: number;
  received_at: string;
  forward_to: string | null;
}

export interface MailActivityDto {
  id: string;
  mailAccountId: string;
  recipientEmail: string;
  sender: string;
  senderName: string;
  subject: string;
  snippet: string;
  isRead: boolean;
  receivedAt: string;
  forwardTo: string | null;
}
