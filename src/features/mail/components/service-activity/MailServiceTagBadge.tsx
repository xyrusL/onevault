import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../../../theme';
import { getBrandIconCandidates } from '../../../two-factor/utils/two-factor-icon.utils';
import { useServiceBadgeStyle } from '../../context/ServiceBadgeStyleContext';
import { DetectedServiceTag } from '../../types/mail-service-detector.types';
import type { ServiceBadgeStyle } from '../../types/mail.types';

interface MailServiceTagBadgeProps {
  tag: DetectedServiceTag;
  size?: 'sm' | 'md';
  showCount?: boolean;
  styleOverride?: ServiceBadgeStyle;
  onClick?: (tag: DetectedServiceTag) => void;
  isSelected?: boolean;
}

export const MailServiceTagBadge: React.FC<MailServiceTagBadgeProps> = ({
  tag,
  size = 'sm',
  showCount = false,
  styleOverride,
  onClick,
  isSelected = false,
}) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const { badgeStyle } = useServiceBadgeStyle();
  const activeStyle = styleOverride ?? badgeStyle;

  const iconCandidates = useMemo(
    () => getBrandIconCandidates(tag.displayName || tag.name, isDark, tag.domain),
    [tag.displayName, tag.name, isDark, tag.domain]
  );
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [iconCandidates]);

  const currentIconUrl =
    candidateIndex < iconCandidates.length ? iconCandidates[candidateIndex] : null;

  const handleIconError = () => {
    setCandidateIndex((prev) => prev + 1);
  };

  const isSm = size === 'sm';

  const tooltip = `${tag.displayName} (${tag.category}) · ${
    tag.confidence === 'verified'
      ? 'Verified via incoming email domain'
      : tag.confidence === 'high'
      ? 'High confidence match'
      : 'Inferred from account metadata'
  }${tag.matchedCount > 0 ? ` · ${tag.matchedCount} messages` : ''}`;

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.stopPropagation();
      onClick(tag);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.stopPropagation();
      onClick(tag);
    }
  };

  // 1. Icon Only Mode (Default requested by user - forced square/squircle rounded-md)
  if (activeStyle === 'icon') {
    const hasCount = showCount && tag.matchedCount > 0;
    return (
      <span
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        title={tooltip}
        className={`inline-flex items-center justify-center rounded-md border transition-all duration-150 shrink-0 ${
          isSm
            ? hasCount
              ? 'h-5 px-1.5 gap-1'
              : 'h-5 w-5'
            : hasCount
            ? 'h-6 px-2 gap-1.5'
            : 'h-6 w-6'
        } ${tag.colorClass.bg} ${tag.colorClass.border} ${tag.colorClass.text} ${
          onClick
            ? 'cursor-pointer hover:border-strong hover:bg-elevated/90 hover:scale-105 active:scale-95'
            : 'select-none'
        } ${isSelected ? 'ring-2 ring-sky-400/60 ring-offset-1 ring-offset-surface' : ''}`}
      >
        {currentIconUrl ? (
          <img
            src={currentIconUrl}
            alt={tag.displayName}
            loading="lazy"
            onError={handleIconError}
            className={`${
              isSm ? 'h-2.5 w-2.5 max-h-2.5 max-w-2.5' : 'h-3.5 w-3.5 max-h-3.5 max-w-3.5'
            } object-contain shrink-0 rounded-[3px] overflow-hidden`}
          />
        ) : (
          <span className={`h-1.5 w-1.5 rounded-xs shrink-0 ${tag.colorClass.dot}`} />
        )}
        {hasCount && (
          <span className="rounded px-1 py-0 text-[9px] font-mono font-bold opacity-90 bg-black/25">
            {tag.matchedCount}
          </span>
        )}
      </span>
    );
  }

  // 2. Icon & Name Mode
  if (activeStyle === 'both') {
    return (
      <span
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        title={tooltip}
        className={`inline-flex items-center gap-1.5 font-medium rounded-md border transition-all duration-150 ${
          isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
        } ${tag.colorClass.bg} ${tag.colorClass.border} ${tag.colorClass.text} ${
          onClick
            ? 'cursor-pointer hover:border-strong hover:bg-elevated/80 active:scale-95'
            : 'select-none'
        } ${isSelected ? 'ring-1 ring-sky-400/50' : ''}`}
      >
        {currentIconUrl ? (
          <img
            src={currentIconUrl}
            alt=""
            loading="lazy"
            onError={handleIconError}
            className={`${
              isSm ? 'h-2.5 w-2.5 max-h-2.5 max-w-2.5' : 'h-3.5 w-3.5 max-h-3.5 max-w-3.5'
            } object-contain shrink-0 rounded-[3px] overflow-hidden`}
          />
        ) : (
          <span className={`h-1.5 w-1.5 rounded-xs shrink-0 ${tag.colorClass.dot}`} />
        )}
        <span className="truncate font-semibold tracking-tight leading-none">
          {tag.displayName}
        </span>
        {showCount && tag.matchedCount > 0 && (
          <span className="ml-0.5 rounded px-1 py-0 text-[9px] font-mono opacity-80 bg-black/20">
            {tag.matchedCount}
          </span>
        )}
      </span>
    );
  }

  // 3. Name Only Mode (Legacy dot + text word)
  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title={tooltip}
      className={`inline-flex items-center gap-1 font-medium rounded-md border transition-all duration-150 ${
        isSm ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
      } ${tag.colorClass.bg} ${tag.colorClass.border} ${tag.colorClass.text} ${
        onClick
          ? 'cursor-pointer hover:border-strong hover:bg-elevated/80 active:scale-95'
          : 'select-none'
      } ${isSelected ? 'ring-1 ring-sky-400/50' : ''}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${tag.colorClass.dot}`} />
      <span className="truncate font-semibold tracking-tight leading-none">
        {tag.displayName}
      </span>
      {showCount && tag.matchedCount > 0 && (
        <span className="ml-0.5 rounded px-1 py-0 text-[9px] font-mono opacity-80 bg-black/20">
          {tag.matchedCount}
        </span>
      )}
    </span>
  );
};
