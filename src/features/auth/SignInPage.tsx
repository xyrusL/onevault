import React from 'react';
import { HalftoneTriangleBg } from '../../shared/components/backgrounds/HalftoneTriangleBg';
import { OneVaultLogo } from '../../shared/components/brand/OneVaultLogo';
import { ThemeControlPill } from '../../shared/components/theme-controls/ThemeControlPill';
import { SignInForm } from './components/SignInForm';
import { AuthSession } from './types/auth.types';

interface SignInPageProps {
  onSignInSuccess: (session: AuthSession) => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onSignInSuccess }) => {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center px-4 py-12 overflow-hidden">
      <HalftoneTriangleBg />

      <div className="fixed top-5 right-5 z-20">
        <ThemeControlPill />
      </div>

      <main className="relative z-10 w-full max-w-[380px]">
        <div className="rounded-2xl bg-surface backdrop-blur-xl border border-default shadow-card p-7 sm:p-9 transition-all duration-300">
          <div className="flex flex-col items-center text-center mb-7">
            <OneVaultLogo size="lg" className="mb-3.5" />

            <h1 className="font-display text-xl font-semibold tracking-tight text-fg-primary">
              OneVault
            </h1>
            <p className="mt-1 text-sm text-fg-secondary">
              Enter your credentials to unlock your vault
            </p>
          </div>

          <SignInForm onSuccess={onSignInSuccess} />
        </div>
      </main>
    </div>
  );
};
