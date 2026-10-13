import { MailActivityItem } from './mail-inbox.types';
import { MailAccountItem } from './mail.types';

export type ServiceCategory =
  | 'developer'
  | 'social'
  | 'gaming'
  | 'design'
  | 'productivity'
  | 'commerce'
  | 'finance'
  | 'entertainment'
  | 'other';

export type ServiceConfidence = 'verified' | 'high' | 'inferred';

export interface DetectedServiceTag {
  id: string;
  name: string;
  displayName: string;
  domain: string;
  category: ServiceCategory;
  confidence: ServiceConfidence;
  colorClass: {
    bg: string;
    border: string;
    text: string;
    dot: string;
    glow: string;
  };
  matchedCount: number;
  lastSeenDate?: string;
  lastSeenTime?: string;
  firstSeenDate?: string;
  latestSubject?: string;
  detectionSource: 'domain_match' | 'sender_name' | 'subject_pattern' | 'account_note';
}

export interface AccountServiceDetectionSummary {
  account: MailAccountItem;
  tags: DetectedServiceTag[];
  primaryTag?: DetectedServiceTag;
  totalIncomingCount: number;
  lastActivityDate?: string;
  activityItems: MailActivityItem[];
}
