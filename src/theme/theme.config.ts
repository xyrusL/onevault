/**
 * Central Theme Configuration (Single Source of Truth)
 */

export type ThemeMode = 'light' | 'dark';
export type FontScale = 'compact' | 'default' | 'comfortable';

export interface ThemeConfig {
  mode: ThemeMode;
  scale: FontScale;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: 'dark',
  scale: 'compact',
};

export const THEME_STORAGE_KEY = 'onevault-theme-config';
