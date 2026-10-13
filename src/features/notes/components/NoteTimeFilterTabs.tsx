import React from 'react';
import { TimeFilterRange } from '../types/notes.types';

interface NoteTimeFilterTabsProps {
  value: TimeFilterRange;
  onChange: (val: TimeFilterRange) => void;
}

const TABS: { id: TimeFilterRange; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Todays' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
];

export const NoteTimeFilterTabs: React.FC<NoteTimeFilterTabsProps> = ({
  value,
  onChange,
}) => {
  return (
    <div className="flex items-center gap-1">
      {TABS.map((tab) => {
        const isActive = value === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              isActive
                ? 'text-fg-primary bg-elevated shadow-2xs font-bold'
                : 'text-fg-muted hover:text-fg-secondary hover:bg-elevated/50'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
