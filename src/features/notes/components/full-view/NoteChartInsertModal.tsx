import React, { useState } from 'react';
import {
  ChartPieSlice,
  ChartBar,
  ChartLineUp,
  Plus,
  Trash,
  Lightning,
} from '@phosphor-icons/react';
import { BaseModal } from '../../../../shared/components/modals/BaseModal';
import { NoteChartConfig, NoteChartDataItem, NoteChartType } from '../../types/notes.types';

interface NoteChartInsertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (chart: NoteChartConfig) => void;
}

const PRESET_CHARTS: Array<{
  label: string;
  type: NoteChartType;
  title: string;
  data: NoteChartDataItem[];
}> = [
  {
    label: 'Vault Asset Breakdown',
    type: 'pie',
    title: 'Encrypted Vault Storage',
    data: [
      { name: 'Mail Inboxes', value: 12, color: '#3b82f6' },
      { name: 'Encrypted Notes', value: 8, color: '#a855f7' },
      { name: '2FA Tokens', value: 3, color: '#10b981' },
    ],
  },
  {
    label: 'Cloudflare Edge Traffic',
    type: 'bar',
    title: 'Monthly API Requests (k)',
    data: [
      { name: 'Aug', value: 420, color: '#3b82f6' },
      { name: 'Sep', value: 680, color: '#6366f1' },
      { name: 'Oct', value: 985, color: '#10b981' },
    ],
  },
  {
    label: 'Daily Latency Benchmark',
    type: 'line',
    title: 'Edge Response Times (ms)',
    data: [
      { name: 'Mon', value: 19, color: '#3b82f6' },
      { name: 'Tue', value: 22, color: '#3b82f6' },
      { name: 'Wed', value: 18, color: '#3b82f6' },
      { name: 'Thu', value: 24, color: '#3b82f6' },
      { name: 'Fri', value: 20, color: '#3b82f6' },
    ],
  },
];

const PALETTE = [
  '#3b82f6',
  '#10b981',
  '#a855f7',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
  '#ef4444',
];

export const NoteChartInsertModal: React.FC<NoteChartInsertModalProps> = ({
  isOpen,
  onClose,
  onInsert,
}) => {
  const [chartType, setChartType] = useState<NoteChartType>('pie');
  const [title, setTitle] = useState('Data Distribution');
  const [items, setItems] = useState<NoteChartDataItem[]>([
    { name: 'Category A', value: 45, color: '#3b82f6' },
    { name: 'Category B', value: 30, color: '#10b981' },
    { name: 'Category C', value: 25, color: '#a855f7' },
  ]);
  const [error, setError] = useState<string | null>(null);

  const handleAddItem = () => {
    const nextColor = PALETTE[items.length % PALETTE.length];
    setItems([
      ...items,
      {
        name: `Item ${items.length + 1}`,
        value: 10,
        color: nextColor,
      },
    ]);
  };

  const handleUpdateItem = (
    index: number,
    field: keyof NoteChartDataItem,
    val: string | number
  ) => {
    const next = [...items];
    next[index] = {
      ...next[index],
      [field]: field === 'value' ? Number(val) || 0 : val,
    };
    setItems(next);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setError('A chart must contain at least 1 data row.');
      return;
    }
    setError(null);
    setItems(items.filter((_, i) => i !== index));
  };

  const handleApplyPreset = (preset: typeof PRESET_CHARTS[0]) => {
    setChartType(preset.type);
    setTitle(preset.title);
    setItems(preset.data);
    setError(null);
  };

  const handleInsert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a chart title.');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one data category.');
      return;
    }

    const newChart: NoteChartConfig = {
      id: `chart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: chartType,
      title: title.trim(),
      data: items,
    };

    onInsert(newChart);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Insert Interactive Chart"
      subtitle="Embed interactive Pie, Bar, or Line graphs directly inside your note canvas."
      icon={<ChartPieSlice size={18} weight="duotone" className="text-accent" />}
      maxWidthClass="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-default hover:bg-elevated text-xs font-medium text-fg-secondary hover:text-fg-primary transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleInsert}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-accent text-accent-fg hover:bg-accent-hover text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={13} weight="bold" />
            <span>Embed Chart</span>
          </button>
        </div>
      }
    >
      <form onSubmit={handleInsert} className="space-y-3.5 text-xs font-sans">
        {error && (
          <div className="p-2 rounded-lg bg-danger/10 border border-danger/25 text-danger text-[11px] font-medium">
            {error}
          </div>
        )}

        {/* Chart Type Selector */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono font-semibold uppercase text-fg-secondary">
            Chart Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setChartType('pie')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
                chartType === 'pie'
                  ? 'bg-accent text-accent-fg border-accent shadow-xs'
                  : 'bg-elevated/40 border-subtle text-fg-secondary hover:bg-elevated'
              }`}
            >
              <ChartPieSlice size={15} weight="duotone" />
              <span>Pie Graph</span>
            </button>

            <button
              type="button"
              onClick={() => setChartType('bar')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-accent text-accent-fg border-accent shadow-xs'
                  : 'bg-elevated/40 border-subtle text-fg-secondary hover:bg-elevated'
              }`}
            >
              <ChartBar size={15} weight="duotone" />
              <span>Bar Graph</span>
            </button>

            <button
              type="button"
              onClick={() => setChartType('line')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-mono font-semibold transition-all cursor-pointer ${
                chartType === 'line'
                  ? 'bg-accent text-accent-fg border-accent shadow-xs'
                  : 'bg-elevated/40 border-subtle text-fg-secondary hover:bg-elevated'
              }`}
            >
              <ChartLineUp size={15} weight="duotone" />
              <span>Line Graph</span>
            </button>
          </div>
        </div>

        {/* Chart Title */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono font-semibold uppercase text-fg-secondary">
            Chart Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Budget Breakdown"
            className="w-full rounded-xl bg-elevated/50 border border-default px-3 py-2 text-xs text-fg-primary placeholder:text-fg-placeholder focus:border-accent focus:outline-none transition-colors"
          />
        </div>

        {/* Quick Sample Presets */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-[10px] font-mono uppercase text-fg-muted">
            <Lightning size={12} className="text-amber-400" />
            <span>Quick Presets</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
            {PRESET_CHARTS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="p-1.5 rounded-lg border border-subtle bg-elevated/30 hover:bg-elevated/70 text-left transition-colors cursor-pointer"
              >
                <div className="text-[10.5px] font-semibold text-fg-primary truncate">
                  {p.label}
                </div>
                <div className="text-[9.5px] font-mono text-fg-muted uppercase">
                  {p.type} chart
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Data Rows Builder */}
        <div className="space-y-2 pt-1 border-t border-subtle">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono font-semibold uppercase text-fg-secondary">
              Data Categories ({items.length})
            </label>
            <button
              type="button"
              onClick={handleAddItem}
              className="inline-flex items-center gap-1 text-[11px] font-mono text-accent hover:underline cursor-pointer"
            >
              <Plus size={11} weight="bold" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-1.5 rounded-lg bg-elevated/30 border border-subtle"
              >
                {/* Color preview circle */}
                <input
                  type="color"
                  value={item.color || '#3b82f6'}
                  onChange={(e) => handleUpdateItem(idx, 'color', e.target.value)}
                  title="Pick slice/bar color"
                  className="h-6 w-6 rounded-md border-0 bg-transparent cursor-pointer shrink-0 p-0"
                />

                {/* Category Name */}
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                  placeholder="Category label"
                  className="flex-1 rounded-md bg-surface border border-default px-2 py-1 text-xs text-fg-primary focus:outline-none focus:border-accent"
                />

                {/* Numeric Value */}
                <input
                  type="number"
                  value={item.value}
                  onChange={(e) => handleUpdateItem(idx, 'value', e.target.value)}
                  placeholder="Value"
                  className="w-20 rounded-md bg-surface border border-default px-2 py-1 text-xs font-mono text-fg-primary focus:outline-none focus:border-accent"
                />

                {/* Remove row */}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  title="Remove row"
                  className="p-1 text-fg-muted hover:text-danger rounded hover:bg-danger/10 transition-colors cursor-pointer"
                >
                  <Trash size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </form>
    </BaseModal>
  );
};
