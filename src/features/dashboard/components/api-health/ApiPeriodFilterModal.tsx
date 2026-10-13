import React, { useEffect, useState } from 'react';
import { CalendarBlank } from '@phosphor-icons/react';
import { BaseModal } from '../../../../shared/components/modals/BaseModal';

export const MONTH_NAMES: Record<string, string> = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'May',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Aug',
  '09': 'Sep',
  '10': 'Oct',
  '11': 'Nov',
  '12': 'Dec',
};

export const MONTH_OPTIONS = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct (Current)' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' },
];

export const YEAR_OPTIONS = ['2026'];

interface ApiPeriodFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  streamType?: 'telemetry' | 'distribution';
  isHistorical: boolean;
  initialMonth: string;
  initialYear?: string;
  onApply: (mode: 'live' | 'archive', month: string, year: string) => void;
  onResetToLive: () => void;
}

export const ApiPeriodFilterModal: React.FC<ApiPeriodFilterModalProps> = ({
  isOpen,
  onClose,
  title = 'API Health Period & Archive Filter',
  subtitle = 'Inspect live edge telemetry or audit previous monthly error/warning records',
  streamType = 'telemetry',
  isHistorical,
  initialMonth,
  initialYear: _initialYear = '2026',
  onApply,
  onResetToLive,
}) => {
  const [tempMode, setTempMode] = useState<'live' | 'archive'>(
    isHistorical ? 'archive' : 'live'
  );
  const [tempMonth, setTempMonth] = useState(initialMonth);
  const tempYear = '2026';

  useEffect(() => {
    if (isOpen) {
      setTempMode(isHistorical ? 'archive' : 'live');
      setTempMonth(initialMonth);
    }
  }, [isOpen, isHistorical, initialMonth]);

  const handleApply = () => {
    onApply(tempMode, tempMonth, tempYear);
    onClose();
  };

  const handleReset = () => {
    onResetToLive();
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={<CalendarBlank size={18} weight="bold" className="text-accent" />}
      maxWidthClass="max-w-md"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg border border-default hover:bg-elevated text-xs font-mono text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer"
          >
            Reset to Default (Live)
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg hover:bg-elevated text-xs font-medium text-fg-muted hover:text-fg-primary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-3.5 py-1.5 rounded-lg bg-accent text-accent-fg hover:bg-accent-hover text-xs font-semibold font-mono transition-colors cursor-pointer shadow-xs"
            >
              Apply Period
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 font-sans text-xs">
        {/* Mode Selector Segment */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono font-semibold text-fg-secondary uppercase tracking-wider">
            Telemetry Stream Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTempMode('live')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                tempMode === 'live'
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30'
                  : 'border-subtle bg-elevated/40 text-fg-secondary hover:bg-elevated'
              }`}
            >
              <div className="font-semibold text-xs text-fg-primary flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Present (Live)
              </div>
              <div className="text-[10.5px] text-fg-muted font-mono mt-1">
                Fresh baseline · 0 errors
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTempMode('archive')}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                tempMode === 'archive'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30'
                  : 'border-subtle bg-elevated/40 text-fg-secondary hover:bg-elevated'
              }`}
            >
              <div className="font-semibold text-xs text-fg-primary flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Historical Archive
              </div>
              <div className="text-[10.5px] text-fg-muted font-mono mt-1">
                Audit past logs &amp; incidents
              </div>
            </button>
          </div>
        </div>

        {/* Month & Year Selectors (visible in archive mode) */}
        {tempMode === 'archive' ? (
          <div className="p-3 rounded-xl bg-elevated/50 border border-subtle space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-semibold text-fg-primary">
                Select Archive Period:
              </span>
              <span className="text-[10.5px] font-mono text-amber-400 font-semibold">
                {MONTH_NAMES[tempMonth] || tempMonth} {tempYear}
              </span>
            </div>

            {/* 1. Year Selector (Strictly 2026 - start year) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-fg-muted uppercase">Year</span>
                <span className="text-[10px] font-mono text-fg-muted">OneVault 2026 Cycle</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-accent text-accent-fg border border-accent shadow-xs cursor-default"
                >
                  2026
                </button>
              </div>
            </div>

            {/* 2. Month Selector (Direct visible 12-month grid with auto-scroll container) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-fg-muted uppercase">
                  Month (12 Options)
                </span>
                <span className="text-[10px] font-mono text-fg-muted">
                  Click to select
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-xl bg-surface/60 border border-subtle">
                {MONTH_OPTIONS.map((m) => {
                  const isSelected = tempMonth === m.value;
                  const isCurrent = m.value === '10';
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setTempMonth(m.value)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-mono text-center transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold shadow-xs ring-1 ring-amber-500/30'
                          : 'bg-elevated/40 border-subtle text-fg-secondary hover:text-fg-primary hover:bg-elevated'
                      }`}
                    >
                      <span className="block leading-none font-medium">{m.label.replace(' (Current)', '')}</span>
                      {isCurrent ? (
                        <span className="block text-[8.5px] font-sans mt-0.5 text-emerald-400 font-semibold leading-none">
                          Current
                        </span>
                      ) : (
                        <span className="block text-[8.5px] font-mono mt-0.5 text-fg-muted leading-none">
                          {m.value}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
              {streamType === 'telemetry'
                ? 'Loading this month will pull archived error telemetry, warning events, and recorded peak latency spikes from the database.'
                : 'Loading this month will pull archived HTTP response codes (200 OK, 4xx warnings, 5xx errors) from that monthly cycle.'}
            </p>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 space-y-1 text-xs">
            <div className="font-semibold text-[11px] font-mono">Clean Live Baseline Active</div>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
              Every month starts fresh. Errors and warnings from previous months are cleanly archived and do not pollute your active live stream.
            </p>
          </div>
        )}

        <div className="text-[10.5px] text-fg-muted font-mono border-t border-subtle pt-2">
          Tip: Refreshing the page or switching tabs automatically restores the default present live stream.
        </div>
      </div>
    </BaseModal>
  );
};
