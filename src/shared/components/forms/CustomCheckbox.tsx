import React from 'react';
import { Check } from '@phosphor-icons/react';

export interface CustomCheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/**
 * CustomCheckbox
 *
 * Site-wide reusable custom checkbox component replacing native `<input type="checkbox">`.
 * Matches OneVault semantic design tokens with smooth focus, hover, and check transitions.
 */
export const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}) => {
  return (
    <label
      htmlFor={id}
      className={`inline-flex items-center gap-2 select-none group transition-opacity ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <div
        className={`h-4 w-4 rounded-[5px] border flex items-center justify-center transition-all duration-150 shrink-0 ${
          checked
            ? 'bg-accent border-accent text-accent-fg shadow-xs scale-100'
            : 'bg-elevated/80 border-default group-hover:border-accent/60 text-transparent'
        } ${disabled ? '' : 'group-hover:scale-105'}`}
        aria-hidden="true"
      >
        <Check
          size={11}
          weight="bold"
          className={`transition-transform duration-150 ${checked ? 'scale-100' : 'scale-0'}`}
        />
      </div>
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <div className="text-[11px] font-mono font-medium text-fg-secondary group-hover:text-fg-primary transition-colors">
              {label}
            </div>
          )}
          {description && (
            <div className="text-[10px] text-fg-muted font-mono leading-tight">
              {description}
            </div>
          )}
        </div>
      )}
    </label>
  );
};
