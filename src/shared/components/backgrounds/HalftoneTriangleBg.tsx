import React from 'react';
import { useTheme } from '../../../theme';

/**
 * HalftoneTriangleBg
 *
 * Uses a single full-viewport `object-cover` layer of `/bg-pattern.png` so the
 * halftone triangle pattern covers the entire screen seamlessly with no square seams.
 */
export const HalftoneTriangleBg: React.FC = () => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden select-none z-0 bg-canvas transition-colors duration-300"
    >
      <img
        src="/bg-pattern.png"
        alt=""
        className="h-full w-full object-cover object-center transition-opacity duration-300"
        style={{
          opacity: 'var(--pattern-opacity)',
          filter: isDark ? 'invert(1)' : 'none',
          mixBlendMode: isDark ? 'screen' : 'multiply',
        }}
      />

      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--bg-canvas) 78%, transparent) 0%, color-mix(in srgb, var(--bg-canvas) 30%, transparent) 52%, transparent 100%)',
        }}
      />
    </div>
  );
};
