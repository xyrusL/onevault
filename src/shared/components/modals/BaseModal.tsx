import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from '@phosphor-icons/react';

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClass?: string;
  bodyClassName?: string;
}

/**
 * BaseModal
 *
 * Site-wide reusable modal shell stored in `src/shared/components/modals/`.
 * Uses React `createPortal(..., document.body)` so the modal is always
 * positioned relative to the full browser viewport above the navbar and sidebar,
 * never clipped by parent containers or CSS transforms.
 */
export const BaseModal: React.FC<BaseModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidthClass = 'max-w-md',
  bodyClassName = 'p-5',
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:px-4 sm:py-5 overflow-y-auto"
    >
      {/* Full-Viewport Backdrop (covers navbar, sidebar, and content) */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200 animate-portal-view"
      />

      {/* Optically Centered Modal Dialog Surface */}
      <div
        className={`relative z-10 w-full ${maxWidthClass} max-h-[90vh] my-auto flex flex-col rounded-xl bg-surface-solid border border-default shadow-card animate-portal-view`}
      >
        {/* Modal Header — vertically centered icon, title stack, and close button */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-subtle px-4 py-3.5 rounded-t-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-elevated border border-default text-fg-primary">
                {icon}
              </div>
            )}
            <div className="min-w-0 flex flex-col justify-center">
              <h2
                id="modal-title"
                className="font-display text-sm font-semibold tracking-tight text-fg-primary truncate leading-tight"
              >
                {title}
              </h2>
              {subtitle && (
                <p className="font-mono text-xs text-fg-secondary truncate mt-0.5 leading-tight">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-elevated hover:text-fg-primary transition-colors cursor-pointer"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div
          className={`flex-1 ${
            bodyClassName && /\boverflow(-[xy])?-(auto|hidden|scroll|visible)\b/.test(bodyClassName)
              ? ''
              : 'overflow-y-auto'
          } text-sm text-fg-primary ${bodyClassName || 'p-4'}`}
        >
          {children}
        </div>

        {/* Optional Modal Footer */}
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-subtle bg-elevated/50 px-4 py-3 rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
