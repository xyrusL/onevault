import { NoteColor } from '../types/notes.types';

export interface ColorThemeDefinition {
  id: NoteColor;
  label: string;
  cardClass: string;
  badgeClass: string;
  dotColor: string;
  iconBgClass: string;
}

export const NOTE_COLOR_THEMES: Record<NoteColor, ColorThemeDefinition> = {
  default: {
    id: 'default',
    label: 'Vault Default',
    cardClass: 'bg-surface border-default text-fg-primary shadow-xs',
    badgeClass: 'bg-elevated border-default text-fg-secondary',
    dotColor: '#71717a',
    iconBgClass: 'bg-elevated text-fg-secondary',
  },
  yellow: {
    id: 'yellow',
    label: 'Lemon Yellow',
    cardClass:
      'bg-[#fef9c3]/90 border-[#fef08a] text-[#713f12] dark:bg-amber-950/25 dark:border-amber-600/35 dark:text-amber-100 shadow-xs',
    badgeClass:
      'bg-amber-100/90 border-amber-200 text-amber-900 dark:bg-amber-900/40 dark:border-amber-700/50 dark:text-amber-200',
    dotColor: '#eab308',
    iconBgClass:
      'bg-amber-200/80 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200',
  },
  coral: {
    id: 'coral',
    label: 'Peach Coral',
    cardClass:
      'bg-[#ffe4e6]/90 border-[#fecdd3] text-[#881337] dark:bg-rose-950/25 dark:border-rose-600/35 dark:text-rose-100 shadow-xs',
    badgeClass:
      'bg-rose-100/90 border-rose-200 text-rose-900 dark:bg-rose-900/40 dark:border-rose-700/50 dark:text-rose-200',
    dotColor: '#f43f5e',
    iconBgClass:
      'bg-rose-200/80 text-rose-900 dark:bg-rose-900/50 dark:text-rose-200',
  },
  blue: {
    id: 'blue',
    label: 'Sky Blue',
    cardClass:
      'bg-[#e0f2fe]/90 border-[#bae6fd] text-[#0c4a6e] dark:bg-sky-950/25 dark:border-sky-600/35 dark:text-sky-100 shadow-xs',
    badgeClass:
      'bg-sky-100/90 border-sky-200 text-sky-900 dark:bg-sky-900/40 dark:border-sky-700/50 dark:text-sky-200',
    dotColor: '#0284c7',
    iconBgClass:
      'bg-sky-200/80 text-sky-900 dark:bg-sky-900/50 dark:text-sky-200',
  },
  green: {
    id: 'green',
    label: 'Mint Green',
    cardClass:
      'bg-[#dcfce7]/90 border-[#bbf7d0] text-[#14532d] dark:bg-emerald-950/25 dark:border-emerald-600/35 dark:text-emerald-100 shadow-xs',
    badgeClass:
      'bg-emerald-100/90 border-emerald-200 text-emerald-900 dark:bg-emerald-900/40 dark:border-emerald-700/50 dark:text-emerald-200',
    dotColor: '#10b981',
    iconBgClass:
      'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200',
  },
  purple: {
    id: 'purple',
    label: 'Lavender Purple',
    cardClass:
      'bg-[#ede9fe]/90 border-[#ddd6fe] text-[#4c1d95] dark:bg-purple-950/25 dark:border-purple-600/35 dark:text-purple-100 shadow-xs',
    badgeClass:
      'bg-purple-100/90 border-purple-200 text-purple-900 dark:bg-purple-900/40 dark:border-purple-700/50 dark:text-purple-200',
    dotColor: '#8b5cf6',
    iconBgClass:
      'bg-purple-200/80 text-purple-900 dark:bg-purple-900/50 dark:text-purple-200',
  },
  amber: {
    id: 'amber',
    label: 'Warm Amber',
    cardClass:
      'bg-[#ffedd5]/90 border-[#fed7aa] text-[#7c2d12] dark:bg-orange-950/25 dark:border-orange-600/35 dark:text-orange-100 shadow-xs',
    badgeClass:
      'bg-orange-100/90 border-orange-200 text-orange-900 dark:bg-orange-900/40 dark:border-orange-700/50 dark:text-orange-200',
    dotColor: '#f97316',
    iconBgClass:
      'bg-orange-200/80 text-orange-900 dark:bg-orange-900/50 dark:text-orange-200',
  },
};

export function getNoteColorTheme(color: NoteColor | string): ColorThemeDefinition {
  return NOTE_COLOR_THEMES[color as NoteColor] || NOTE_COLOR_THEMES.default;
}

export const FOLDER_COLOR_OPTIONS: {
  id: string;
  label: string;
  bgClass: string;
  dotColor: string;
  selectedBorderClass: string;
}[] = [
  {
    id: 'purple',
    label: 'Lavender Purple',
    bgClass: 'bg-[#ede9fe] text-purple-900 dark:bg-purple-950/30 dark:text-purple-200',
    dotColor: '#8b5cf6',
    selectedBorderClass: 'border-2 border-purple-500 dark:border-purple-400 ring-2 ring-purple-500/30 shadow-[0_0_18px_rgba(168,85,247,0.35)]',
  },
  {
    id: 'coral',
    label: 'Peach Coral',
    bgClass: 'bg-[#ffe4e6] text-rose-900 dark:bg-rose-950/30 dark:text-rose-200',
    dotColor: '#f43f5e',
    selectedBorderClass: 'border-2 border-rose-500 dark:border-rose-400 ring-2 ring-rose-500/30 shadow-[0_0_18px_rgba(244,63,94,0.35)]',
  },
  {
    id: 'yellow',
    label: 'Lemon Yellow',
    bgClass: 'bg-[#fef9c3] text-amber-900 dark:bg-amber-950/30 dark:text-amber-200',
    dotColor: '#eab308',
    selectedBorderClass: 'border-2 border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/30 shadow-[0_0_18px_rgba(245,158,11,0.35)]',
  },
  {
    id: 'blue',
    label: 'Sky Blue',
    bgClass: 'bg-[#e0f2fe] text-sky-900 dark:bg-sky-950/30 dark:text-sky-200',
    dotColor: '#0284c7',
    selectedBorderClass: 'border-2 border-sky-500 dark:border-sky-400 ring-2 ring-sky-500/30 shadow-[0_0_18px_rgba(14,165,233,0.35)]',
  },
  {
    id: 'green',
    label: 'Mint Green',
    bgClass: 'bg-[#dcfce7] text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200',
    dotColor: '#10b981',
    selectedBorderClass: 'border-2 border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/30 shadow-[0_0_18px_rgba(16,185,129,0.35)]',
  },
  {
    id: 'amber',
    label: 'Warm Amber',
    bgClass: 'bg-[#ffedd5] text-orange-900 dark:bg-orange-950/30 dark:text-orange-200',
    dotColor: '#f97316',
    selectedBorderClass: 'border-2 border-orange-500 dark:border-orange-400 ring-2 ring-orange-500/30 shadow-[0_0_18px_rgba(249,115,22,0.35)]',
  },
  {
    id: 'pink',
    label: 'Rose Pink',
    bgClass: 'bg-[#fce7f3] text-pink-900 dark:bg-pink-950/30 dark:text-pink-200',
    dotColor: '#ec4899',
    selectedBorderClass: 'border-2 border-pink-500 dark:border-pink-400 ring-2 ring-pink-500/30 shadow-[0_0_18px_rgba(236,72,153,0.35)]',
  },
  {
    id: 'indigo',
    label: 'Royal Indigo',
    bgClass: 'bg-[#e0e7ff] text-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200',
    dotColor: '#6366f1',
    selectedBorderClass: 'border-2 border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/30 shadow-[0_0_18px_rgba(99,102,241,0.35)]',
  },
  {
    id: 'teal',
    label: 'Ocean Teal',
    bgClass: 'bg-[#ccfbf1] text-teal-900 dark:bg-teal-950/30 dark:text-teal-200',
    dotColor: '#14b8a6',
    selectedBorderClass: 'border-2 border-teal-500 dark:border-teal-400 ring-2 ring-teal-500/30 shadow-[0_0_18px_rgba(20,184,166,0.35)]',
  },
  {
    id: 'cyan',
    label: 'Arctic Cyan',
    bgClass: 'bg-[#cffafe] text-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-200',
    dotColor: '#06b6d4',
    selectedBorderClass: 'border-2 border-cyan-500 dark:border-cyan-400 ring-2 ring-cyan-500/30 shadow-[0_0_18px_rgba(6,182,212,0.35)]',
  },
  {
    id: 'lime',
    label: 'Fresh Lime',
    bgClass: 'bg-[#ecfccb] text-lime-900 dark:bg-lime-950/30 dark:text-lime-200',
    dotColor: '#84cc16',
    selectedBorderClass: 'border-2 border-lime-500 dark:border-lime-400 ring-2 ring-lime-500/30 shadow-[0_0_18px_rgba(132,204,22,0.35)]',
  },
  {
    id: 'red',
    label: 'Crimson Red',
    bgClass: 'bg-[#fee2e2] text-red-900 dark:bg-red-950/30 dark:text-red-200',
    dotColor: '#ef4444',
    selectedBorderClass: 'border-2 border-red-500 dark:border-red-400 ring-2 ring-red-500/30 shadow-[0_0_18px_rgba(239,68,68,0.35)]',
  },
  {
    id: 'fuchsia',
    label: 'Vivid Fuchsia',
    bgClass: 'bg-[#fae8ff] text-fuchsia-900 dark:bg-fuchsia-950/30 dark:text-fuchsia-200',
    dotColor: '#d946ef',
    selectedBorderClass: 'border-2 border-fuchsia-500 dark:border-fuchsia-400 ring-2 ring-fuchsia-500/30 shadow-[0_0_18px_rgba(217,70,239,0.35)]',
  },
  {
    id: 'violet',
    label: 'Deep Violet',
    bgClass: 'bg-[#ddd6fe] text-violet-900 dark:bg-violet-950/30 dark:text-violet-200',
    dotColor: '#7c3aed',
    selectedBorderClass: 'border-2 border-violet-500 dark:border-violet-400 ring-2 ring-violet-500/30 shadow-[0_0_18px_rgba(124,58,237,0.35)]',
  },
  {
    id: 'emerald',
    label: 'Forest Emerald',
    bgClass: 'bg-[#d1fae5] text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-200',
    dotColor: '#059669',
    selectedBorderClass: 'border-2 border-emerald-600 dark:border-emerald-400 ring-2 ring-emerald-500/30 shadow-[0_0_18px_rgba(5,150,105,0.35)]',
  },
  {
    id: 'slate',
    label: 'Graphite Slate',
    bgClass: 'bg-[#f1f5f9] text-slate-900 dark:bg-slate-800/50 dark:text-slate-200',
    dotColor: '#64748b',
    selectedBorderClass: 'border-2 border-slate-500 dark:border-slate-400 ring-2 ring-slate-500/30 shadow-[0_0_18px_rgba(100,116,139,0.35)]',
  },
];

export function getFolderTheme(color: string) {
  const match = FOLDER_COLOR_OPTIONS.find((f) => f.id === color);
  return (
    match || {
      id: 'default',
      label: 'Default',
      bgClass: 'bg-elevated text-fg-primary',
      dotColor: '#71717a',
      selectedBorderClass: 'border-2 border-accent ring-2 ring-accent/30 shadow-md',
    }
  );
}
