import React from 'react';
import { ArrowClockwise, Tray } from '@phosphor-icons/react';
import { MailInboxMessageSummary } from '../types/mail-inbox.types';

interface MailInboxSidebarListProps {
  messages: MailInboxMessageSummary[];
  selectedMessageId: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  onSelectMessage: (messageId: string) => void;
  onRefresh: () => void;
}

export const MailInboxSidebarList: React.FC<MailInboxSidebarListProps> = ({
  messages,
  selectedMessageId,
  isLoading,
  isRefreshing,
  onSelectMessage,
  onRefresh,
}) => {
  return (
    <aside className="w-full md:w-72 shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-default bg-elevated/30">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between gap-2 border-b border-subtle px-3.5 py-2.5">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-fg-muted leading-none">
          <Tray size={14} weight="duotone" className="text-fg-secondary shrink-0" />
          <span>Inbox ({messages.length})</span>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh inbox"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-default bg-elevated text-fg-secondary hover:text-fg-primary hover:border-strong disabled:opacity-50 cursor-pointer"
        >
          <ArrowClockwise
            size={12}
            weight="bold"
            className={isRefreshing ? 'animate-spin' : ''}
          />
        </button>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto divide-y divide-subtle max-h-56 md:max-h-[440px]">
        {messages.length === 0 ? (
          <div className="px-4 py-12 text-center text-xs text-fg-muted space-y-1">
            <p className="font-medium text-fg-secondary">
              {isLoading ? 'Loading messages...' : 'No messages yet'}
            </p>
            {!isLoading && (
              <p className="text-fg-muted leading-relaxed">
                Incoming emails to this address will automatically be saved to D1 and appear here.
              </p>
            )}
          </div>
        ) : (
          messages.map((msg) => {
            const isSelected = msg.id === selectedMessageId;
            return (
              <button
                key={msg.id}
                type="button"
                onClick={() => onSelectMessage(msg.id)}
                className={`w-full text-left px-3.5 py-2.5 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-elevated border-l-2 border-l-accent'
                    : 'hover:bg-elevated/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {!msg.isRead && (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                    )}
                    <span
                      className={`text-xs truncate leading-tight ${
                        msg.isRead
                          ? 'font-medium text-fg-secondary'
                          : 'font-semibold text-fg-primary'
                      }`}
                    >
                      {msg.senderName}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-fg-muted shrink-0 leading-none">
                    {msg.receivedTime}
                  </span>
                </div>

                <p
                  className={`mt-1 text-xs truncate leading-tight ${
                    msg.isRead
                      ? 'text-fg-secondary'
                      : 'font-semibold text-fg-primary'
                  }`}
                >
                  {msg.subject}
                </p>

                <p className="mt-1 text-[11px] text-fg-muted truncate leading-tight">
                  {msg.snippet}
                </p>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
