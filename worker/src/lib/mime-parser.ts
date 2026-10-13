import PostalMime from 'postal-mime';

export interface ParsedMimeEmail {
  sender: string;
  senderName: string;
  subject: string;
  snippet: string;
  textBody: string | null;
  htmlBody: string | null;
  rawMime: string;
}

function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses a raw RFC-5322 email stream or string using `postal-mime` and returns
 * both structured fields (HTML, text, sender, subject) and the complete raw MIME string.
 */
export async function parseIncomingMime(
  rawSource: ReadableStream<Uint8Array> | ArrayBuffer | string,
  fallbackFrom: string
): Promise<ParsedMimeEmail> {
  const rawMime =
    typeof rawSource === 'string'
      ? rawSource
      : await new Response(rawSource).text();

  const parsed = await PostalMime.parse(rawMime);

  const sender = parsed.from?.address?.trim() || fallbackFrom || 'unknown@sender';
  const senderName =
    parsed.from?.name?.trim() ||
    sender.split('@')[0] ||
    'Unknown Sender';
  const subject = parsed.subject?.trim() || '(No subject)';
  const textBody = parsed.text?.trim() || null;
  const htmlBody = parsed.html?.trim() || null;

  const plainSource = textBody || (htmlBody ? stripHtmlTags(htmlBody) : '');
  const snippet = plainSource.slice(0, 140) || '(Empty message)';

  return {
    sender,
    senderName,
    subject,
    snippet,
    textBody,
    htmlBody,
    rawMime,
  };
}
