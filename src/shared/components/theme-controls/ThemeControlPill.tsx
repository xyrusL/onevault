import React from 'react';
import { Moon, Sun } from '@phosphor-icons/react';
import { useTheme } from '../../../theme';

export const ThemeControlPill: React.FC = () => {
  const { mode, toggleMode } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label="Toggle color theme"
      title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
      className="flex items-center justify-center rounded-lg bg-surface backdrop-blur-md border border-default p-1.5 text-fg-secondary hover:text-fg-primary hover:bg-elevated shadow-xs cursor-pointer"
    >
      {mode === 'light' ? (
        <Moon size={15} weight="duotone" />
      ) : (
        <Sun size={15} weight="duotone" />
      )}
    </button>
  );
};
