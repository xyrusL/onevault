import { apiRequest } from '../../../shared/services/api-client.service';
import { AuthCredentials, AuthSession } from '../types/auth.types';
import { passkeyService } from '../../settings/services/passkey.service';

const AUTH_SESSION_STORAGE_KEY = 'onevault-auth-session';

export const authService = {
  /** Signs in through the worker (`POST /api/auth/login`) and stores the session token. */
  async signIn({ email, password }: AuthCredentials): Promise<AuthSession> {
    const session = await apiRequest<AuthSession>('/auth/login', {
      method: 'POST',
      body: { email, password },
      auth: false,
    });
    this.saveSession(session);
    return session;
  },

  /** Signs in passwordlessly using WebAuthn / Passkey (`POST /api/auth/passkey/login-options` + `login-verify`). */
  async signInWithPasskey(): Promise<AuthSession> {
    const session = await passkeyService.signInWithPasskey();
    return session;
  },

  /** Check if any passkeys are enrolled in this vault. */
  async checkPasskeyAvailability(): Promise<boolean> {
    const status = await passkeyService.checkStatus();
    return status.hasPasskeys;
  },

  saveSession(session: AuthSession): void {
    try {
      localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('onevault-session-updated', { detail: session }));
      }
    } catch {
      // ignore storage errors
    }
  },

  getSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
      const parsed = raw ? (JSON.parse(raw) as Partial<AuthSession>) : null;
      return parsed?.token && parsed.email ? (parsed as AuthSession) : null;
    } catch {
      return null;
    }
  },

  clearSession(): void {
    try {
      localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  },
};
