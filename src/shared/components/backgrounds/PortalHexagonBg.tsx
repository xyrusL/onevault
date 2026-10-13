import React from 'react';
import { useTheme } from '../../../theme';

/**
 * PortalHexagonBg
 *
 * Renders the native 16:9 3D layered wave background (`/portal-bg.png`)
 * seamlessly across the viewport in both Light and Dark modes.
 */
export const PortalHexagonBg: React.FC = () => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden select-none z-0 bg-canvas transition-colors duration-300"
    >
      <img
        src="/portal-bg.png"
        alt=""
        className="h-full w-full object-cover object-center transition-all duration-300"
        style={{
          opacity: isDark ? 0.52 : 0.96,
          filter: isDark
            ? 'invert(1) brightness(0.75) contrast(1.25)'
            : 'brightness(1.02) contrast(1.04)',
          mixBlendMode: isDark ? 'screen' : 'multiply',
        }}
      />
    </div>
  );
};
