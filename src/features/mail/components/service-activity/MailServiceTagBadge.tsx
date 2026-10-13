import React from 'react';
import { DetectedServiceTag } from '../../types/mail-service-detector.types';

interface MailServiceTagBadgeProps {
  tag: DetectedServiceTag;
  size?: 'sm' | 'md';
  showCount?: boolean;
  onClick?: (tag: DetectedServiceTag) => void;
  isSelected?: boolean;
}

export const MailServiceTagBadge: React.FC<MailServiceTagBadgeProps> = ({
  tag,
  size = 'sm',
  showCount = false,
  onClick,
  isSelected = false,
}) => {
  const isSm = size === 'sm';

  return (
    <span
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick(tag);
        }
      }}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.stopPropagation();
          onClick(tag);
        }
      }}
      title={`${tag.displayName} (${tag.category}) · ${
        tag.confidence === 'verified'
          ? 'Verified via incoming email domain'
          : tag.confidence === 'high'
          ? 'High confidence match'
          : 'Inferred from account metadata'
      }${tag.matchedCount > 0 ? ` · ${tag.matchedCount} messages` : ''}`}
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
