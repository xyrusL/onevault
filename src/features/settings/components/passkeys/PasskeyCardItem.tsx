import React, { useState } from 'react';
import {
  Desktop,
  DeviceMobile,
  Key,
  Trash,
  Clock,
  CheckCircle,
  AppleLogo,
  WindowsLogo,
  CloudCheck,
  ShieldCheck,
} from '@phosphor-icons/react';
import { parseDevicePlatform } from '../../utils/device-detection.utils';
import { RevokePasskeyModal } from './RevokePasskeyModal';
import type { PasskeyItem } from '../../types/passkey.types';

interface PasskeyCardItemProps {
  passkey: PasskeyItem;
  onDelete: (id: string) => Promise<void>;
}

export const PasskeyCardItem: React.FC<PasskeyCardItemProps> = ({ passkey, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { platform, label } = parseDevicePlatform(passkey.userAgent, passkey.deviceType);

  const renderPlatformIcon = () => {
    switch (platform) {
      case 'apple':
        return <AppleLogo size={20} weight="fill" className="text-fg-primary" />;
      case 'windows':
        return <WindowsLogo size={20} weight="fill" className="text-sky-500" />;
      case 'android':
      case 'mobile':
        return <DeviceMobile size={20} weight="duotone" className="text-emerald-500" />;
      case 'key':
        return <Key size={20} weight="duotone" className="text-amber-500" />;
      default:
        return <Desktop size={20} weight="duotone" className="text-accent" />;
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(passkey.id);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to delete passkey:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="rounded-xl bg-surface border border-default p-4 hover:border-subtle transition-all duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Device Icon & Information */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-elevated border border-default shadow-2xs">
            {renderPlatformIcon()}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-display text-sm font-semibold text-fg-primary truncate">
                {passkey.name}
              </h4>

              {passkey.backedUp ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CloudCheck size={11} weight="fill" />
                  <span>Synced Passkey</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-accent-muted text-accent border border-accent/20">
                  <ShieldCheck size={11} weight="fill" />
                  <span>Hardware Bound</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mt-1 text-[11px] font-mono text-fg-secondary flex-wrap">
              <span className="text-fg-muted">{label}</span>
              <span className="text-fg-muted">•</span>
              <span className="flex items-center gap-1">
                <Clock size={12} className="text-fg-muted" />
                <span>
                  Enrolled{' '}
                  {new Date(passkey.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </span>
              <span className="text-fg-muted">•</span>
              <span className="flex items-center gap-1">
                {passkey.lastUsedAt ? (
                  <>
                    <CheckCircle size={12} className="text-emerald-500" weight="fill" />
                    <span>
                      Last used{' '}
                      {new Date(passkey.lastUsedAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </>
                ) : (
                  <span className="text-fg-muted italic">Never used yet</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions / Delete & Revoke */}
        <div className="flex items-center self-end sm:self-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-default text-xs font-mono text-fg-secondary hover:text-red-500 hover:border-red-500/30 hover:bg-red-500/5 transition-colors cursor-pointer"
            title="Revoke access for this passkey"
          >
            <Trash size={13} />
            <span>Revoke Access</span>
          </button>
        </div>
      </div>

      {/* Revoke Passkey Confirmation Modal */}
      <RevokePasskeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        passkeyName={passkey.name}
        deviceLabel={label}
        isDeleting={isDeleting}
      />
    </div>
  );
};
