import { MailActivityItem } from '../types/mail-inbox.types';
import {
  AccountServiceDetectionSummary,
  DetectedServiceTag,
  ServiceCategory,
} from '../types/mail-service-detector.types';
import { MailAccountItem } from '../types/mail.types';

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC COLOR THEMES PALETTE
// Deterministically assigned via string hashing so ANY website gets a unique,
// balanced, aesthetic color pill without requiring any hardcoded website list.
// ─────────────────────────────────────────────────────────────────────────────
const DYNAMIC_COLOR_PALETTES: Array<{
  category: ServiceCategory;
  styles: { bg: string; border: string; text: string; dot: string; glow: string };
}> = [
  {
    category: 'developer',
    styles: {
      bg: 'bg-sky-500/12',
      border: 'border-sky-500/35',
      text: 'text-sky-300',
      dot: 'bg-sky-400',
      glow: '',
    },
  },
  {
    category: 'social',
    styles: {
      bg: 'bg-indigo-500/12',
      border: 'border-indigo-500/35',
      text: 'text-indigo-300',
      dot: 'bg-indigo-400',
      glow: '',
    },
  },
  {
    category: 'gaming',
    styles: {
      bg: 'bg-purple-500/12',
      border: 'border-purple-500/35',
      text: 'text-purple-300',
      dot: 'bg-purple-400',
      glow: '',
    },
  },
  {
    category: 'design',
    styles: {
      bg: 'bg-amber-500/12',
      border: 'border-amber-500/35',
      text: 'text-amber-300',
      dot: 'bg-amber-400',
      glow: '',
    },
  },
  {
    category: 'productivity',
    styles: {
      bg: 'bg-emerald-500/12',
      border: 'border-emerald-500/35',
      text: 'text-emerald-300',
      dot: 'bg-emerald-400',
      glow: '',
    },
  },
  {
    category: 'commerce',
    styles: {
      bg: 'bg-cyan-500/12',
      border: 'border-cyan-500/35',
      text: 'text-cyan-300',
      dot: 'bg-cyan-400',
      glow: '',
    },
  },
  {
    category: 'finance',
    styles: {
      bg: 'bg-teal-500/12',
      border: 'border-teal-500/35',
      text: 'text-teal-300',
      dot: 'bg-teal-400',
      glow: '',
    },
  },
  {
    category: 'entertainment',
    styles: {
      bg: 'bg-rose-500/12',
      border: 'border-rose-500/35',
      text: 'text-rose-300',
      dot: 'bg-rose-400',
      glow: '',
    },
  },
];

/**
 * Computes deterministic color theme from brand name.
 */
function resolveDynamicPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DYNAMIC_COLOR_PALETTES.length;
  return DYNAMIC_COLOR_PALETTES[index];
}

// Subdomains to strip iteratively during generic domain extraction
const SUBDOMAINS_TO_STRIP_REGEX =
  /^(?:mail|mailer|email|in|em|t|e|bounces?|notifications?|notify|service|news|updates?|no-reply|reply|msg|marketing|transactional|mx|post|send|m|info|alerts?|support|accounts?|auth|app|gateway|outbound)\./i;

// Public suffixes & TLDs to strip dynamically
const TLD_STRIP_REGEX =
  /\.(?:co\.[a-z]{2}|com\.[a-z]{2}|org\.[a-z]{2}|[a-z]{2,12})$/i;

// Generic noise words in sender display names to strip dynamically
const SENDER_NOISE_WORDS_REGEX =
  /\s*(?:team|support|notifications?|security|alerts?|community|bot|updates?|service|staff|helpdesk|reminders?|platform|account|system|official|no-reply|billing|admin|desk|friend suggestions?|follow suggestions?|posts?-recaps?)\s*$/gi;

/**
 * Dynamically extracts clean domain from an email address without any hardcoding.
 */
export function extractSenderDomain(senderEmail: string): string {
  const atIndex = senderEmail.lastIndexOf('@');
  if (atIndex === -1) return '';
  let domain = senderEmail.slice(atIndex + 1).toLowerCase().trim();
  domain = domain.replace(/[>\]\s]/g, '');

  // Iteratively strip mail/routing subdomains
  while (SUBDOMAINS_TO_STRIP_REGEX.test(domain)) {
    domain = domain.replace(SUBDOMAINS_TO_STRIP_REGEX, '');
  }
  return domain;
}

/**
 * Formats a raw brand string into clean title case.
 * E.g. "openrouter" -> "OpenRouter", "github" -> "GitHub", "my-service" -> "My Service"
 */
function toBrandTitle(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();

  // If already mixed-case (e.g. "OpenRouter", "GitHub", "Supabase", "YouTube"), preserve it!
  const hasUpper = /[A-Z]/.test(trimmed);
  const hasLower = /[a-z]/.test(trimmed);
  if (hasUpper && hasLower && !trimmed.includes('-') && !trimmed.includes('_')) {
    return trimmed;
  }

  // Handle common known brand letterings naturally
  const lower = trimmed.toLowerCase();
  const knownCasing: Record<string, string> = {
    github: 'GitHub',
    gitlab: 'GitLab',
    openrouter: 'OpenRouter',
    supabase: 'Supabase',
    youtube: 'YouTube',
    linkedin: 'LinkedIn',
    dribbble: 'Dribbble',
    tiktok: 'TikTok',
    playstation: 'PlayStation',
    paypal: 'PayPal',
  };
  if (knownCasing[lower]) return knownCasing[lower];

  // Convert kebab/snake/space to words
  return trimmed
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Dynamically decomposes any domain from the internet into a clean brand name.
 * E.g. "github.com" -> "GitHub"
 *      "facebookmail.com" -> "Facebook"
 *      "in.dribbble.com" -> "Dribbble"
 *      "openrouter.ai" -> "OpenRouter"
 *      "mycoolstartup.io" -> "Mycoolstartup"
 */
export function decomposeDomainDynamically(domain: string): { brandName: string; cleanDomain: string } {
  let clean = domain.toLowerCase().trim();
  while (SUBDOMAINS_TO_STRIP_REGEX.test(clean)) {
    clean = clean.replace(SUBDOMAINS_TO_STRIP_REGEX, '');
  }

  // Strip TLD
  let base = clean.replace(TLD_STRIP_REGEX, '');

  // If base ends with "mail" (e.g. facebookmail, twittermail, pinterestmail) and base is long enough, strip "mail"
  if (base.endsWith('mail') && base.length > 6) {
    base = base.slice(0, -4);
  }

  return {
    brandName: toBrandTitle(base),
    cleanDomain: clean,
  };
}

/**
 * Dynamically detects a service brand tag from an incoming activity message.
 * Completely dynamic: parses domain, sender display name, bracket patterns, and subjects.
 * Zero hardcoded website lists!
 */
export function detectServiceFromActivity(activity: MailActivityItem): DetectedServiceTag | null {
  const domain = extractSenderDomain(activity.sender);
  const senderName = (activity.senderName || '').trim();
  const subject = (activity.subject || '').trim();

  let detectedBrand = '';
  let source: DetectedServiceTag['detectionSource'] = 'domain_match';

  // 1. Dynamic Check: Sender display name contains "... on [Platform]" or "... via [Platform]"
  // E.g. "Jane on Instagram" -> "Instagram"
  if (senderName) {
    const onMatch = senderName.match(/(?:on|via|from)\s+([A-Za-z0-9_-]{2,30})/i);
    if (onMatch && onMatch[1]) {
      detectedBrand = toBrandTitle(onMatch[1]);
      source = 'sender_name';
    }
  }

  // 2. Dynamic Check: Subject begins with bracketed brand "[Brand]"
  // E.g. "[GitHub] Please verify...", "[Discord] Your verification...", "[Vercel] Deployment failed"
  if (!detectedBrand && subject) {
    const bracketMatch = subject.match(/^\[([A-Za-z0-9_.\s-]{2,30})\]/);
    if (bracketMatch && bracketMatch[1]) {
      detectedBrand = toBrandTitle(bracketMatch[1].trim());
      source = 'subject_pattern';
    }
  }

  // 3. Dynamic Check: Sender display name contains a valid clean brand title
  // E.g. "GitHub" -> "GitHub", "Spotify" -> "Spotify", "OpenRouter Team" -> "OpenRouter"
  if (!detectedBrand && senderName && !senderName.includes('@')) {
    const cleanedSender = senderName.replace(SENDER_NOISE_WORDS_REGEX, '').trim();
    if (
      cleanedSender &&
      cleanedSender.length >= 2 &&
      cleanedSender.length <= 35 &&
      !/^no[-_ ]?reply$/i.test(cleanedSender) &&
      !/^notifications?$/i.test(cleanedSender) &&
      !/^support$/i.test(cleanedSender) &&
      !/^admin$/i.test(cleanedSender)
    ) {
      detectedBrand = toBrandTitle(cleanedSender);
      source = 'sender_name';
    }
  }

  // 4. Dynamic Fallback: Decompose the sender's domain (Works on ANY website on the internet!)
  if (!detectedBrand && domain && domain.includes('.')) {
    const decomposed = decomposeDomainDynamically(domain);
    if (decomposed.brandName && decomposed.brandName.length >= 2) {
      detectedBrand = decomposed.brandName;
      source = 'domain_match';
    }
  }

  // 5. Dynamic Check: Welcome email pattern in subject
  // E.g. "Welcome to Linear", "Welcome to Figma"
  if (!detectedBrand && subject) {
    const welcomeMatch = subject.match(/welcome\s+to\s+([A-Za-z0-9_-]{2,30})/i);
    if (welcomeMatch && welcomeMatch[1]) {
      detectedBrand = toBrandTitle(welcomeMatch[1].trim());
      source = 'subject_pattern';
    }
  }

  if (!detectedBrand) return null;

  const palette = resolveDynamicPalette(detectedBrand);
  const cleanDomain = domain || `${detectedBrand.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

  return {
    id: `tag_${detectedBrand.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    name: detectedBrand,
    displayName: detectedBrand,
    domain: cleanDomain,
    category: palette.category,
    confidence: source === 'domain_match' ? 'verified' : 'high',
    colorClass: palette.styles,
    matchedCount: 1,
    lastSeenDate: activity.receivedDate,
    lastSeenTime: activity.receivedTime,
    firstSeenDate: activity.receivedDate,
    latestSubject: subject,
    detectionSource: source,
  };
}

/**
 * Checks an account's note field dynamically if no incoming emails have arrived yet.
 * E.g. note = "github account" -> infers "GitHub".
 */
export function inferServiceFromAccountNote(account: MailAccountItem): DetectedServiceTag | null {
  const note = (account.note || '').trim();
  if (!note) return null;

  // Extract first significant brand word from note (excluding "account", "login", "for", "email", etc.)
  const cleanNote = note.replace(/\b(?:account|login|email|signup|test|vault|personal|work)\b/gi, '').trim();
  const words = cleanNote.split(/[\s,.-]+/).filter((w) => w.length >= 2);
  if (words.length === 0) return null;

  const candidate = toBrandTitle(words[0]);
  if (!candidate || candidate.length < 2) return null;

  const palette = resolveDynamicPalette(candidate);

  return {
    id: `tag_${candidate.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    name: candidate,
    displayName: candidate,
    domain: `${candidate.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    category: palette.category,
    confidence: 'inferred',
    colorClass: palette.styles,
    matchedCount: 0,
    detectionSource: 'account_note',
  };
}

/**
 * Aggregates all incoming activities and account notes to produce a comprehensive
 * service detection map indexed by accountId and email address.
 */
export function buildServiceDetectionMap(
  accounts: MailAccountItem[],
  activities: MailActivityItem[]
): {
  byAccountId: Map<string, AccountServiceDetectionSummary>;
  byEmail: Map<string, AccountServiceDetectionSummary>;
  allTags: DetectedServiceTag[];
} {
  const byAccountId = new Map<string, AccountServiceDetectionSummary>();
  const byEmail = new Map<string, AccountServiceDetectionSummary>();

  // 1. Initialize for all known accounts
  for (const acc of accounts) {
    const summary: AccountServiceDetectionSummary = {
      account: acc,
      tags: [],
      totalIncomingCount: 0,
      activityItems: [],
    };
    byAccountId.set(acc.id, summary);
    byEmail.set(acc.email.toLowerCase(), summary);

    // Seed with note inference if available
    const noteTag = inferServiceFromAccountNote(acc);
    if (noteTag) {
      summary.tags.push(noteTag);
      summary.primaryTag = noteTag;
    }
  }

  // 2. Process incoming activity events
  for (const act of activities) {
    const emailKey = act.recipientEmail.toLowerCase();
    let summary = byEmail.get(emailKey);

    if (!summary && act.mailAccountId) {
      summary = byAccountId.get(act.mailAccountId);
    }

    if (!summary) {
      // Ephemeral / unassigned recipient
      const pseudoAccount: MailAccountItem = {
        id: act.mailAccountId || `pseudo_${emailKey}`,
        localPart: emailKey.split('@')[0] || '',
        domain: emailKey.split('@')[1] || '',
        email: act.recipientEmail,
        forwardTo: act.forwardTo || 'None',
        note: '',
        createdDate: act.receivedDate,
        createdTime: act.receivedTime,
      };
      summary = {
        account: pseudoAccount,
        tags: [],
        totalIncomingCount: 0,
        activityItems: [],
      };
      byEmail.set(emailKey, summary);
      if (act.mailAccountId) byAccountId.set(act.mailAccountId, summary);
    }

    summary.activityItems.push(act);
    summary.totalIncomingCount++;
    if (!summary.lastActivityDate) {
      summary.lastActivityDate = act.receivedDate;
    }

    // Dynamically detect tag for this activity
    const detected = detectServiceFromActivity(act);
    if (detected) {
      const existingTagIndex = summary.tags.findIndex(
        (t) => t.name.toLowerCase() === detected.name.toLowerCase()
      );
      if (existingTagIndex >= 0) {
        const existing = summary.tags[existingTagIndex];
        existing.matchedCount += 1;
        if (detected.confidence === 'verified') existing.confidence = 'verified';
        if (!existing.lastSeenDate) existing.lastSeenDate = detected.lastSeenDate;
      } else {
        // If there was an inferred note tag with the same name, replace with live verified one
        const inferredIdx = summary.tags.findIndex(
          (t) => t.confidence === 'inferred' && t.name.toLowerCase() === detected.name.toLowerCase()
        );
        if (inferredIdx >= 0) {
          summary.tags[inferredIdx] = detected;
        } else {
          summary.tags.push(detected);
        }
      }
    }
  }

  // 3. Determine primaryTag for each summary
  const allUniqueTagsMap = new Map<string, DetectedServiceTag>();

  for (const summary of byAccountId.values()) {
    summary.tags.sort((a, b) => {
      if (a.confidence === 'verified' && b.confidence !== 'verified') return -1;
      if (b.confidence === 'verified' && a.confidence !== 'verified') return 1;
      return b.matchedCount - a.matchedCount;
    });
    if (summary.tags.length > 0) {
      summary.primaryTag = summary.tags[0];
    }
    for (const tag of summary.tags) {
      allUniqueTagsMap.set(tag.name.toLowerCase(), tag);
    }
  }

  return {
    byAccountId,
    byEmail,
    allTags: Array.from(allUniqueTagsMap.values()),
  };
}

/**
 * Searches if an account matches a search query against its email, note, forwardTo,
 * OR ANY OF ITS GENERATED SERVICE TAGS & DOMAINS.
 */
export function accountMatchesSearch(
  account: MailAccountItem,
  summary: AccountServiceDetectionSummary | undefined,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  // Standard fields
  if (
    account.email.toLowerCase().includes(q) ||
    account.forwardTo.toLowerCase().includes(q) ||
    account.note.toLowerCase().includes(q)
  ) {
    return true;
  }

  // Check dynamically generated service tags
  if (summary && summary.tags) {
    for (const tag of summary.tags) {
      if (
        tag.name.toLowerCase().includes(q) ||
        tag.domain.toLowerCase().includes(q) ||
        tag.category.toLowerCase().includes(q)
      ) {
        return true;
      }
    }
  }

  return false;
}
