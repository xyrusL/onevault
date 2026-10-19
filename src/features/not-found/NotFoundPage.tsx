import React, { useEffect } from 'react';
import { authService } from '../auth';
import { ThemeControlPill } from '../../shared/components/theme-controls/ThemeControlPill';
import { routeThreatGuardService } from '../../shared/services/route-threat-guard.service';
import { useTheme } from '../../theme';
import { DisconnectedPlugIllustration } from './components/DisconnectedPlugIllustration';

interface NotFoundPageProps {
  onGoHome?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onGoHome }) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';

  // Silently record route probes in the background without exposing telemetry to visitors
  useEffect(() => {
    const hasSession = Boolean(authService.getSession());
    routeThreatGuardService.recordUnknownRouteProbe(
      window.location.pathname,
      hasSession
    );
  }, []);

  const handleGoHome = () => {
    routeThreatGuardService.clearClientProbeState();
    if (onGoHome) {
      onGoHome();
    } else {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center px-4 py-8 sm:py-12 bg-canvas text-fg-primary overflow-x-hidden selection:bg-accent selection:text-accent-fg">
      {/* Theme switcher pill in top-right corner to test/switch light & dark mode */}
      <div className="fixed top-5 right-5 z-20">
        <ThemeControlPill />
      </div>

      {/* Main card matching reference layout */}
      <main className="relative z-10 w-full max-w-2xl sm:max-w-3xl rounded-3xl bg-surface-solid border border-default shadow-card px-6 py-10 sm:px-12 sm:py-14 flex flex-col items-center text-center transition-all duration-300">
        {/* Transparent Vector Disconnected Power Cord Banner */}
        <div className="relative w-full max-w-xl mb-3 select-none flex items-center justify-center">
          {/* Subtle glowing ambient aura pulsing with electric sparks */}
          <div
            className={`absolute w-52 h-24 rounded-full blur-2xl pointer-events-none transition-all duration-300 animate-pulse ${
              isDark ? 'bg-cyan-400/25' : 'bg-sky-400/15'
            }`}
            style={{ animationDuration: '2.2s' }}
          />

          <DisconnectedPlugIllustration
            isDark={isDark}
            className="w-full max-h-[190px] sm:max-h-[220px]"
          />
        </div>

        {/* 404 Headline with grounded shadow line */}
        <div className="relative inline-flex flex-col items-center">
          <h1 className="font-display text-5xl sm:text-6xl font-black tracking-wider text-fg-primary leading-none">
            404
          </h1>
          <div className="w-14 h-1.5 bg-fg-primary/20 rounded-full blur-[1px] mt-1.5" />
        </div>

        {/* Subtitle */}
        <h2 className="font-display text-xl sm:text-2xl font-bold text-fg-primary mt-4 tracking-tight">
          Oops!, Page not Found
        </h2>

        {/* Description text - generic broken link message with zero clues about restricted or internal routes */}
        <p className="mt-3 text-xs sm:text-sm text-fg-secondary max-w-md mx-auto leading-relaxed">
          The link you followed may be broken or does not exist. Please check the address or return to the main dashboard.
        </p>

        {/* Clean pill button matching reference layout */}
        <button
          type="button"
          onClick={handleGoHome}
          className="mt-7 inline-flex items-center justify-center px-8 py-2.5 rounded-full border-2 border-fg-primary text-fg-primary hover:bg-fg-primary hover:text-canvas font-bold text-xs uppercase tracking-widest transition-all duration-200 active:scale-95 shadow-sm cursor-pointer"
        >
          GO BACK HOME
        </button>
      </main>
    </div>
  );
};

