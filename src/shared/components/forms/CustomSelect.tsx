import React, { useEffect, useRef, useState } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  badge?: string;
}

interface CustomSelectProps<T extends string = string> {
  id?: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  icon?: React.ReactNode;
  placeholder?: string;
  maxHeightClass?: string;
  disabled?: boolean;
}

/**
 * CustomSelect
 *
 * Site-wide reusable custom dropdown component replacing native `<select>` / `<option>`.
 * Built with Tailwind CSS + custom animation utilities from `tokens.css`.
 */
export function CustomSelect<T extends string = string>({
  id,
  value,
  options,
  onChange,
  icon,
  placeholder = 'Select option',
  maxHeightClass = 'max-h-52',
  disabled = false,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOptionRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (isOpen && selectedOptionRef.current) {
      selectedOptionRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative w-full select-none">
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={`group flex w-full items-center justify-between gap-2 rounded-md bg-input px-3 py-2 text-sm text-fg-primary border transition-all duration-200 ${
          disabled
            ? 'border-subtle opacity-75 cursor-not-allowed'
            : isOpen
              ? 'border-focus bg-surface-solid ring-2 ring-accent-ring cursor-pointer'
              : 'border-default hover:border-strong hover:bg-input-hover cursor-pointer'
        }`}
      >
        <span className="flex items-center gap-2.5 min-w-0 truncate">
          {icon && (
            <span className="inline-flex items-center justify-center text-fg-muted group-hover:text-fg-secondary shrink-0">
              {icon}
            </span>
          )}
          <span className="truncate font-medium leading-none">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>

        {!disabled && (
          <CaretDown
            size={14}
            weight="bold"
            className={`shrink-0 text-fg-muted group-hover:text-fg-primary transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-fg-primary' : ''
            }`}
          />
        )}
      </button>

      {/* Custom Floating Options Menu */}
      {isOpen && !disabled && (
        <div
          role="listbox"
          className="ov-dropdown-menu absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-lg bg-surface-solid border border-default p-1 shadow-card"
        >
          <div className={`${maxHeightClass} overflow-y-auto space-y-0.5`}>
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  ref={isSelected ? selectedOptionRef : undefined}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? 'bg-accent text-accent-fg font-semibold'
                      : 'text-fg-secondary hover:bg-elevated hover:text-fg-primary font-medium'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate leading-none">
                    <span className="truncate">{opt.label}</span>
                    {opt.badge && (
                      <span
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                          isSelected
                            ? 'bg-accent-fg/15 text-accent-fg'
                            : 'bg-elevated text-fg-muted'
                        }`}
                      >
                        {opt.badge}
                      </span>
                    )}
                  </span>

                  {isSelected && (
                    <Check size={13} weight="bold" className="shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
