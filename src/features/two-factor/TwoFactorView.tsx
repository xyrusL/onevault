import React, { useCallback, useEffect, useState } from 'react';
import { Key, Plus, WarningCircle } from '@phosphor-icons/react';
import { BaseModal } from '../../shared/components/modals';
import { CreateTwoFactorModalContent } from './components/CreateTwoFactorModalContent';
import { TwoFactorDetailsModalContent } from './components/TwoFactorDetailsModalContent';
import { TwoFactorHeader } from './components/TwoFactorHeader';
import { TwoFactorTokenList } from './components/TwoFactorTokenList';
import { twoFactorService } from './services/two-factor.service';
import {
  CreateTwoFactorPayload,
  TwoFactorTokenItem,
} from './types/two-factor.types';

export const TwoFactorView: React.FC = () => {
  const cached = twoFactorService.getCached();
  const [tokens, setTokens] = useState<TwoFactorTokenItem[]>(
    () => cached ?? []
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => !cached);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] =
    useState<TwoFactorTokenItem | null>(null);

  const loadTokens = useCallback(async () => {
    if (!twoFactorService.getCached()?.length) {
      setIsLoading(true);
    }
    setLoadError(null);
    try {
      const list = await twoFactorService.list();
      setTokens(list);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Unable to load 2FA authenticators.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTokens();
  }, [loadTokens]);

  // Live 1-second ticker so all TOTP codes and countdown rings stay synchronized
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const handleCreateToken = async (payload: CreateTwoFactorPayload) => {
    const created = await twoFactorService.create(payload);
    setTokens((prev) => [created, ...prev]);
    setIsCreateModalOpen(false);
  };

  const handleDeleteToken = async (tokenId: string) => {
    await twoFactorService.remove(tokenId);
    setTokens((prev) => prev.filter((t) => t.id !== tokenId));
    setSelectedToken(null);
  };

  return (
    <section className="flex-1 flex flex-col gap-3">
      {/* Page Title + Live Badge + Status Pills and Primary Actions */}
      <TwoFactorHeader
        onCreateClick={() => setIsCreateModalOpen(true)}
        totalTokensCount={tokens.length}
      />

      {loadError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg bg-surface border border-default px-3 py-2 text-xs font-medium text-danger"
        >
          <span className="inline-flex items-center gap-2 min-w-0">
            <WarningCircle size={15} weight="fill" className="shrink-0" />
            <span className="truncate">{loadError}</span>
          </span>
          <button
            type="button"
            onClick={() => void loadTokens()}
            className="shrink-0 rounded-md border border-default bg-elevated px-2.5 py-1 text-fg-secondary hover:text-fg-primary cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Live 2FA Tokens List */}
      <TwoFactorTokenList
        tokens={tokens}
        nowMs={nowMs}
        isLoading={isLoading}
        onSelectToken={(item) => setSelectedToken(item)}
      />

      {/* Reused Shared Modal: Create / Import New 2FA Token */}
      <BaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add 2FA Authenticator"
        subtitle="Drop a QR code image or enter a 2FA URL | secret key."
        icon={<Plus size={15} weight="bold" />}
      >
        <CreateTwoFactorModalContent
          onCancel={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateToken}
        />
      </BaseModal>

      {/* Reused Shared Modal: 2FA Token Details */}
      <BaseModal
        isOpen={Boolean(selectedToken)}
        onClose={() => setSelectedToken(null)}
        title={selectedToken ? `${selectedToken.issuer} 2FA` : '2FA Details'}
        subtitle={selectedToken?.label}
        icon={<Key size={15} weight="duotone" />}
      >
        {selectedToken && (
          <TwoFactorDetailsModalContent
            token={selectedToken}
            nowMs={nowMs}
            onClose={() => setSelectedToken(null)}
            onDelete={(id) => void handleDeleteToken(id)}
          />
        )}
      </BaseModal>
    </section>
  );
};
