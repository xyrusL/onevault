import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CaretLeft,
  CaretRight,
  Lightbulb,
} from '@phosphor-icons/react';
import { DetectedServiceTag } from '../../types/mail-service-detector.types';

export interface MailActivityTipsBoxProps {
  tags?: DetectedServiceTag[];
  intervalMs?: number;
}

interface TipItem {
  id: string;
  badge?: string;
  content: React.ReactNode;
}

const DEFAULT_INTERVAL_MS = 6000;

export const MailActivityTipsBox: React.FC<MailActivityTipsBoxProps> = ({
  tags = [],
  intervalMs = DEFAULT_INTERVAL_MS,
}) => {
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const fadeTimeoutRef = useRef<number | null>(null);

  // Generate the full list of tips:
  // Tip 0 is the contextual note for this specific alias (preserved as requested),
  // followed by 10 dedicated tips rotating every default interval.
  const tips = useMemo<TipItem[]>(() => {
    const contextualTip: TipItem = {
      id: 'contextual-alias-note',
      badge: 'Alias Note',
      content:
        tags.length > 0 ? (
          <span>
            <strong className="text-fg-secondary">
              {tags.length === 1 ? '1 service detected' : `${tags.length} services detected`}
            </strong>{' '}
            for this alias. You can search{' '}
            <strong className="text-sky-400 font-mono">
              "{tags[0].name.toLowerCase()}"
            </strong>{' '}
            anywhere in OneVault to quickly find this address.
          </span>
        ) : (
          <span>
            Service tags are detected automatically when incoming emails arrive from platforms
            like GitHub, Google, or Facebook.
          </span>
        ),
    };

    const generalTips: TipItem[] = [
      {
        id: 'tip-vault-routing',
        badge: 'Vault Routing',
        content: (
          <span>
            Set <strong className="text-fg-secondary">Forward To</strong> to{' '}
            <strong className="text-cyan-400">Vault</strong> to store incoming emails locally in D1
            without forwarding to your personal inbox.
          </span>
        ),
      },
      {
        id: 'tip-tag-filtering',
        badge: 'Tag Filter',
        content: (
          <span>
            Click any service tag chip above to isolate and review inbound activity originating from
            that platform.
          </span>
        ),
      },
      {
        id: 'tip-subdomain-isolation',
        badge: 'Organization',
        content: (
          <span>
            Group your aliases by dedicating subdomains (e.g.{' '}
            <span className="font-mono text-fg-secondary">@shop.domain.com</span>) to partition
            services cleanly.
          </span>
        ),
      },
      {
        id: 'tip-quick-search',
        badge: 'Fast Search',
        content: (
          <span>
            Press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-default text-[10px] font-mono text-fg-primary">
              /
            </kbd>{' '}
            anywhere in OneVault to instantly find aliases by tag, sender, domain, or subject.
          </span>
        ),
      },
      {
        id: 'tip-notepad-memory',
        badge: 'NotePad',
        content: (
          <span>
            Attach private notes to any alias to easily remember what service, username, or recovery
            channel it protects.
          </span>
        ),
      },
      {
        id: 'tip-disposable-alias',
        badge: 'Spam Control',
        content: (
          <span>
            If an address starts receiving unwanted mail, delete or disable this routing rule with
            zero effect on your real inbox.
          </span>
        ),
      },
      {
        id: 'tip-privacy-shield',
        badge: 'Privacy Shield',
        content: (
          <span>
            Your real destination address stays hidden — senders only ever see your custom OneVault
            routing alias.
          </span>
        ),
      },
      {
        id: 'tip-stealth-defense',
        badge: 'Stealth Defense',
        content: (
          <span>
            Automated bot traps and honeypots silently drop malicious traffic before it ever reaches
            your mailbox.
          </span>
        ),
      },
      {
        id: 'tip-cloudflare-edge',
        badge: 'Cloudflare Edge',
        content: (
          <span>
            Emails are processed on Cloudflare Workers edge nodes with sub-10ms delivery speed and
            zero server maintenance.
          </span>
        ),
      },
      {
        id: 'tip-one-click-copy',
        badge: 'Quick Copy',
        content: (
          <span>
            Click the copy icon beside your email address to grab the alias in one click for signup
            forms.
          </span>
        ),
      },
    ];

    return [contextualTip, ...generalTips];
  }, [tags]);

  // Keep index within bounds if tips count changes
  useEffect(() => {
    if (activeTipIndex >= tips.length) {
      setActiveTipIndex(0);
    }
  }, [activeTipIndex, tips.length]);

  // Smooth transition helper
  const goToTip = (nextIndex: number) => {
    if (fadeTimeoutRef.current) {
      window.clearTimeout(fadeTimeoutRef.current);
    }
    setIsFading(true);
    fadeTimeoutRef.current = window.setTimeout(() => {
      setActiveTipIndex(nextIndex);
      setIsFading(false);
    }, 150);
  };

  const handleNext = () => {
    goToTip((activeTipIndex + 1) % tips.length);
  };

  const handlePrev = () => {
    goToTip((activeTipIndex - 1 + tips.length) % tips.length);
  };

  // Auto-rotation timer
  useEffect(() => {
    if (isPaused || tips.length <= 1) return;

    const timer = setInterval(() => {
      setIsFading(true);
      fadeTimeoutRef.current = window.setTimeout(() => {
        setActiveTipIndex((prev) => (prev + 1) % tips.length);
        setIsFading(false);
      }, 150);
    }, intervalMs);

    return () => {
      clearInterval(timer);
      if (fadeTimeoutRef.current) {
        window.clearTimeout(fadeTimeoutRef.current);
      }
    };
  }, [isPaused, tips.length, intervalMs]);

  const currentTip = tips[activeTipIndex] || tips[0];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="rounded-lg border border-default bg-elevated/40 hover:bg-elevated/60 px-3 py-2 transition-colors relative"
    >
      {/* Top Header Bar inside the squared box */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <Lightbulb size={13} weight="fill" className="text-amber-400 shrink-0" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-fg-secondary">
            Notes & Tips
          </span>
          {currentTip.badge && (
            <span className="hidden sm:inline-block rounded bg-surface px-1.5 py-0.2 text-[9px] font-mono text-fg-muted border border-subtle truncate">
              {currentTip.badge}
            </span>
          )}
          {isPaused && (
            <span className="text-[9px] font-mono text-fg-subtle">(paused)</span>
          )}
        </div>

        {/* Rotation Counter and Nav Buttons */}
        <div className="flex items-center gap-1 text-[10px] font-mono text-fg-muted shrink-0">
          <span>
            {activeTipIndex + 1} / {tips.length}
          </span>
          <div className="flex items-center gap-0.5 ml-1">
            <button
              type="button"
              onClick={handlePrev}
              title="Previous tip"
              className="h-4 w-4 inline-flex items-center justify-center rounded hover:bg-surface text-fg-muted hover:text-fg-primary transition-colors cursor-pointer"
            >
              <CaretLeft size={10} weight="bold" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              title="Next tip"
              className="h-4 w-4 inline-flex items-center justify-center rounded hover:bg-surface text-fg-muted hover:text-fg-primary transition-colors cursor-pointer"
            >
              <CaretRight size={10} weight="bold" />
            </button>
          </div>
        </div>
      </div>

      {/* Tip Content Area with smooth transition */}
      <div className="text-[11px] text-fg-muted leading-relaxed min-h-[30px] flex items-center">
        <div
          className={`transition-opacity duration-150 ${
            isFading ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {currentTip.content}
        </div>
      </div>
    </div>
  );
};
