import React, { useState } from 'react';
import {
  ArrowRight,
  CircleNotch,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  Fingerprint,
  LockSimple,
  WarningCircle,
} from '@phosphor-icons/react';
import { authService } from '../services/auth.service';
import { passkeyService } from '../../settings/services/passkey.service';
import { AuthSession } from '../types/auth.types';

interface SignInFormProps {
  onSuccess: (session: AuthSession) => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasskeySubmitting, setIsPasskeySubmitting] = useState(false);

  const isWebAuthnSupported = passkeyService.isSupported();

  const handlePasskeySignIn = async () => {
    setErrorMessage(null);
    setIsPasskeySubmitting(true);
    try {
      const session = await authService.signInWithPasskey();
      onSuccess(session);
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        // User closed or dismissed the browser prompt
        return;
      }
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Passkey verification failed. Please try again or use your password.'
      );
    } finally {
      setIsPasskeySubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) return;

    setIsSubmitting(true);
    try {
      const session = await authService.signIn({ email, password });
      onSuccess(session);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to sign in. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md bg-elevated border border-default px-3.5 py-2.5 text-xs font-medium text-danger"
        >
          <WarningCircle size={16} weight="fill" className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* WebAuthn / Passkey Sign-In Button */}
      {isWebAuthnSupported && (
        <>
          <button
            type="button"
            onClick={handlePasskeySignIn}
            disabled={isSubmitting || isPasskeySubmitting}
            className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-default bg-surface hover:bg-elevated hover:border-accent text-fg-primary py-2.5 px-4 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-3 focus:ring-accent-ring disabled:opacity-60 cursor-pointer shadow-2xs group"
          >
            {isPasskeySubmitting ? (
              <CircleNotch size={18} weight="bold" className="animate-spin text-accent" />
            ) : (
              <Fingerprint
                size={19}
                weight="duotone"
                className="text-accent shrink-0 group-hover:scale-110 transition-transform"
              />
            )}
            <span>
              {isPasskeySubmitting ? 'Waiting for Passkey...' : 'Sign in with Passkey'}
            </span>
          </button>

          <div className="relative flex items-center justify-center py-0.5">
            <div className="border-t border-subtle w-full" />
            <span className="bg-surface px-2.5 text-[10px] font-mono uppercase tracking-wider text-fg-muted shrink-0">
              or with password
            </span>
            <div className="border-t border-subtle w-full" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">

      {/* Email Field */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-xs font-medium uppercase tracking-wider text-fg-secondary"
        >
          Email
        </label>
        <div className="relative flex items-center">
          <EnvelopeSimple
            size={18}
            weight="regular"
            className="pointer-events-none absolute left-3.5 text-fg-muted"
          />
          <input
            id="email"
            type="email"
            inputMode="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            className="w-full rounded-md bg-input hover:bg-input-hover focus:bg-surface-solid pl-10 pr-3.5 py-2.5 text-base text-fg-primary placeholder:text-fg-placeholder border border-default focus:border-focus focus:outline-none focus:ring-3 focus:ring-accent-ring transition-all"
          />
        </div>
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-xs font-medium uppercase tracking-wider text-fg-secondary"
        >
          Password
        </label>
        <div className="relative flex items-center">
          <LockSimple
            size={18}
            weight="regular"
            className="pointer-events-none absolute left-3.5 text-fg-muted"
          />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck="false"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full rounded-md bg-input hover:bg-input-hover focus:bg-surface-solid pl-10 pr-10 py-2.5 text-base text-fg-primary placeholder:text-fg-placeholder border border-default focus:border-focus focus:outline-none focus:ring-3 focus:ring-accent-ring transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-3 p-1 text-fg-muted hover:text-fg-primary transition-colors cursor-pointer"
          >
            {showPassword ? (
              <EyeSlash size={18} weight="regular" />
            ) : (
              <Eye size={18} weight="regular" />
            )}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative w-full flex items-center justify-center gap-2 rounded-md bg-accent hover:bg-accent-hover text-accent-fg py-2.5 px-4 text-base font-medium transition-all duration-150 focus:outline-none focus:ring-3 focus:ring-accent-ring disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? (
            <CircleNotch size={18} weight="bold" className="animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight
                size={16}
                weight="bold"
                className="transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </>
          )}
        </button>
      </div>
    </form>
  </div>
);
};
