import React, { useCallback, useEffect, useState } from 'react';
import { WarningCircle } from '@phosphor-icons/react';
import { mailInboxService } from '../services/mail-inbox.service';
import {
  MailInboxMessageDetail,
  MailInboxMessageSummary,
} from '../types/mail-inbox.types';
import { MailAccountItem } from '../types/mail.types';
import { MailInboxMessageViewer } from './MailInboxMessageViewer';
import { MailInboxSidebarList } from './MailInboxSidebarList';

interface MailInboxModalContentProps {
  account: MailAccountItem;
  initialMessageId?: string | null;
  onMessageRead?: (messageId: string) => void;
  onMessageDeleted?: (messageId: string) => void;
}

export const MailInboxModalContent: React.FC<MailInboxModalContentProps> = ({
  account,
  initialMessageId = null,
  onMessageRead,
  onMessageDeleted,
}) => {
  const cachedList = mailInboxService.getCachedList(account.id);
  const [messages, setMessages] = useState<MailInboxMessageSummary[]>(
    () => cachedList ?? []
  );
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    () => initialMessageId ?? cachedList?.[0]?.id ?? null
  );
  const [selectedDetail, setSelectedDetail] =
    useState<MailInboxMessageDetail | null>(() => {
      const targetId = initialMessageId ?? cachedList?.[0]?.id;
      return targetId ? mailInboxService.getCachedDetail(targetId) : null;
    });
  const [isLoading, setIsLoading] = useState<boolean>(() => !cachedList);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadInbox = useCallback(
    async (showRefreshSpinner = false) => {
      if (showRefreshSpinner) setIsRefreshing(true);
      setErrorMessage(null);
      try {
        const list = await mailInboxService.listMessages(account.id);
        setMessages(list);
        setSelectedMessageId((prev) => {
          if (initialMessageId && list.some((m) => m.id === initialMessageId)) {
            return initialMessageId;
          }
          if (prev && list.some((m) => m.id === prev)) return prev;
          return list[0]?.id ?? null;
        });
      } catch (err) {
        setErrorMessage(
          err instanceof Error ? err.message : 'Unable to load inbox messages.'
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [account.id, initialMessageId]
  );

  useEffect(() => {
    void loadInbox(false);
  }, [loadInbox]);

  useEffect(() => {
    if (!selectedMessageId) {
      setSelectedDetail(null);
      return;
    }

    const cached = mailInboxService.getCachedDetail(selectedMessageId);
    if (cached) {
      setSelectedDetail(cached);
    } else {
      setIsLoadingDetail(true);
    }

    let cancelled = false;
    void mailInboxService
      .getMessageDetail(account.id, selectedMessageId)
      .then((detail) => {
        if (cancelled) return;
        setSelectedDetail(detail);
        setMessages((prev) =>
          prev.map((m) => (m.id === selectedMessageId ? { ...m, isRead: true } : m))
        );
        onMessageRead?.(selectedMessageId);
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMessage(
          err instanceof Error ? err.message : 'Unable to load message content.'
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [account.id, selectedMessageId, onMessageRead]);

  const handleDeleteMessage = async (messageId: string) => {
    await mailInboxService.deleteMessage(account.id, messageId);
    onMessageDeleted?.(messageId);
    setMessages((prev) => {
      const remaining = prev.filter((m) => m.id !== messageId);
      setSelectedMessageId(remaining[0]?.id ?? null);
      return remaining;
    });
  };

  return (
    <div className="space-y-3">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg bg-elevated border border-default px-3 py-2 text-xs font-medium text-danger"
        >
          <WarningCircle size={15} weight="fill" className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Two-Pane Gmail-Style Inbox Layout */}
      <div className="flex flex-col md:flex-row rounded-xl border border-default bg-surface overflow-hidden">
        <MailInboxSidebarList
          messages={messages}
          selectedMessageId={selectedMessageId}
          isLoading={isLoading}
          isRefreshing={isRefreshing}
          onSelectMessage={setSelectedMessageId}
          onRefresh={() => void loadInbox(true)}
        />

        <MailInboxMessageViewer
          message={selectedDetail}
          isLoadingDetail={isLoadingDetail}
          onDeleteMessage={handleDeleteMessage}
        />
      </div>
    </div>
  );
};
