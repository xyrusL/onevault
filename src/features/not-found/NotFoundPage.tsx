import React, { useMemo } from 'react';
import { ShieldCheck, ShieldWarning } from '@phosphor-icons/react';
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

  const probeDecision = useMemo(() => {
    const hasSession = Boolean(authService.getSession());
    return routeThreatGuardService.recordUnknownRouteProbe(
      window.location.pathname,
      hasSession
    );
  }, []);

  const isInterceptedScanner =
    probeDecision.action === 'PENETRATION_BLOCK' ||
    probeDecision.action === 'TEMP_QUARANTINE' ||
    probeDecision.action === 'RATE_LIMITED';

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
              isInterceptedScanner
                ? 'bg-rose-500/25'
                : isDark
                  ? 'bg-cyan-400/25'
                  : 'bg-sky-400/15'
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
            {probeDecision.action === 'PENETRATION_BLOCK' ||
            probeDecision.action === 'TEMP_QUARANTINE'
              ? '403'
              : probeDecision.action === 'RATE_LIMITED'
                ? '429'
                : '404'}
          </h1>
          <div className="w-14 h-1.5 bg-fg-primary/20 rounded-full blur-[1px] mt-1.5" />
        </div>

        {/* Subtitle */}
        <h2 className="font-display text-xl sm:text-2xl font-bold text-fg-primary mt-4 tracking-tight">
          {isInterceptedScanner
            ? 'Adaptive Threat Guard — Route Scan Intercepted'
            : 'Oops!, Page not Found'}
        </h2>

        {/* Description text */}
        <p className="mt-3 text-xs sm:text-sm text-fg-secondary max-w-md mx-auto leading-relaxed">
          {isInterceptedScanner
            ? `OneVault's Behavioral IPS detected unusual route probing on "${probeDecision.pathname}" (${probeDecision.detectionVector}). Only this session is throttled/quarantined while normal site operations remain 100% unaffected.`
            : 'The link you followed may be broken, or the URL address is restricted. Please check the address or return to the main dashboard.'}
        </p>

        {/* Adaptive Threat Guard Telemetry Pill */}
        <div
          className={`mt-4 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] font-mono ${
            isInterceptedScanner
              ? 'border-rose-500/35 bg-rose-500/10 text-rose-400'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          }`}
        >
          {isInterceptedScanner ? (
            <ShieldWarning size={14} weight="fill" className="shrink-0" />
          ) : (
            <ShieldCheck size={14} weight="fill" className="shrink-0" />
          )}
          <span>
            {isInterceptedScanner
              ? `Threat Guard Action: ${probeDecision.action} · Risk Score: ${probeDecision.riskScore}/100`
              : `Typo Tolerance: ${probeDecision.detectionVector} · 0 Penalty`}
          </span>
        </div>

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

