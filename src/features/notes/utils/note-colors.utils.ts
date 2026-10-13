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
