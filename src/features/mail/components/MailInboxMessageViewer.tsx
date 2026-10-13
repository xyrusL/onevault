import React, { useMemo, useState } from 'react';
import {
  Code,
  EnvelopeOpen,
  FileText,
  GlobeSimple,
  Trash,
} from '@phosphor-icons/react';
import {
  MailInboxMessageDetail,
  MailInboxRenderMode,
} from '../types/mail-inbox.types';

interface MailInboxMessageViewerProps {
  message: MailInboxMessageDetail | null;
  isLoadingDetail: boolean;
  onDeleteMessage: (messageId: string) => Promise<void>;
}

/**
 * Wraps the sender's HTML inside a clean document shell so emails render
 * in their original formatting inside a sandboxed iframe.
 */
function buildFormattedHtmlDoc(html: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <base target="_blank" />
  <style>
    html, body {
      margin: 0;
      padding: 14px 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 13.5px;
      line-height: 1.55;
      color: #111827;
      background-color: #ffffff;
      word-break: break-word;
    }
    img { max-width: 100%; height: auto; }
    a { color: #2563eb; }
    pre { white-space: pre-wrap; word-break: break-word; }
  </style>
</head>
<body>${html}</body>
</html>`;
}

export const MailInboxMessageViewer: React.FC<MailInboxMessageViewerProps> = ({
  message,
  isLoadingDetail,
  onDeleteMessage,
}) => {
  const [renderMode, setRenderMode] = useState<MailInboxRenderMode>('formatted');
  const [isDeleting, setIsDeleting] = useState(false);

  const iframeDoc = useMemo(() => {
    if (!message?.htmlBody) return null;
    return buildFormattedHtmlDoc(message.htmlBody);
  }, [message?.htmlBody]);

  if (!message) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[360px]">
        <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-xl bg-elevated border border-default text-fg-muted">
          <EnvelopeOpen size={18} weight="duotone" />
        </div>
        <p className="text-xs font-medium text-fg-secondary">
          {isLoadingDetail ? 'Opening message...' : 'Select a message from the sidebar'}
        </p>
        <p className="mt-1 text-xs text-fg-muted">
          Full HTML formatting and raw D1 MIME payload will appear here.
        </p>
      </div>
    );
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteMessage(message.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-[380px] max-h-[490px]">
      {/* Message Header */}
      <div className="border-b border-subtle px-4 py-3 space-y-2 bg-elevated/20">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold text-fg-primary leading-snug break-words">
            {message.subject}
          </h3>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Mode Switcher: Original Formatted | Plain Text | Raw MIME */}
            <div className="inline-flex items-center rounded-lg border border-default bg-elevated p-0.5">
              <button
                type="button"
                onClick={() => setRenderMode('formatted')}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium leading-none cursor-pointer ${
                  renderMode === 'formatted'
                    ? 'bg-accent text-accent-fg font-semibold'
                    : 'text-fg-secondary hover:text-fg-primary'
                }`}
              >
                <GlobeSimple size={11} weight="bold" />
                <span>Original</span>
              </button>
              <button
                type="button"
                onClick={() => setRenderMode('text')}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium leading-none cursor-pointer ${
                  renderMode === 'text'
                    ? 'bg-accent text-accent-fg font-semibold'
                    : 'text-fg-secondary hover:text-fg-primary'
                }`}
              >
                <FileText size={11} weight="bold" />
                <span>Text</span>
              </button>
              <button
                type="button"
                onClick={() => setRenderMode('raw')}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium leading-none cursor-pointer ${
                  renderMode === 'raw'
                    ? 'bg-accent text-accent-fg font-semibold'
                    : 'text-fg-secondary hover:text-fg-primary'
                }`}
              >
                <Code size={11} weight="bold" />
                <span>Raw</span>
              </button>
            </div>

            <button
              type="button"
              disabled={isDeleting}
              onClick={() => void handleDelete()}
              title="Delete message"
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-default bg-elevated text-danger hover:border-strong disabled:opacity-50 cursor-pointer"
            >
              <Trash size={13} weight="duotone" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-fg-secondary">
          <div className="min-w-0 truncate">
            <span className="font-semibold text-fg-primary">{message.senderName}</span>{' '}
            <span className="font-mono text-fg-muted">&lt;{message.sender}&gt;</span>
          </div>
          <span className="font-mono text-[11px] text-fg-muted shrink-0">
            {message.receivedDate} | {message.receivedTime}
          </span>
        </div>
      </div>

      {/* Message Body Area */}
      <div className="flex-1 overflow-y-auto p-3.5 bg-surface">
        {renderMode === 'formatted' && iframeDoc ? (
          <iframe
            title={message.subject}
            srcDoc={iframeDoc}
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            className="w-full h-full min-h-[320px] rounded-lg border border-default bg-white"
          />
        ) : renderMode === 'raw' ? (
          <pre className="rounded-lg bg-elevated border border-default p-3 font-mono text-xs text-fg-secondary whitespace-pre-wrap break-words leading-relaxed">
            {message.rawMime || '(No raw MIME payload)'}
          </pre>
        ) : (
          <div className="rounded-lg bg-elevated/50 border border-default p-3.5 text-xs text-fg-primary whitespace-pre-wrap break-words leading-relaxed">
            {message.textBody || message.snippet || '(No plain text content)'}
          </div>
        )}
      </div>
    </div>
  );
};
