import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';
import { apiRequest } from '../../../shared/services/api-client.service';
import { authService } from '../../auth/services/auth.service';
import type { AuthSession } from '../../auth/types/auth.types';
import type { PasskeyItem, PasskeyStatusResponse } from '../types/passkey.types';

export const passkeyService = {
  /**
   * Check if the current browser and platform support WebAuthn
   */
  isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return typeof window.PublicKeyCredential !== 'undefined' && browserSupportsWebAuthn();
  },

  /**
   * Check if any passkey is enrolled in system (public endpoint)
   */
  async checkStatus(): Promise<PasskeyStatusResponse> {
    try {
      return await apiRequest<PasskeyStatusResponse>('/auth/passkey/status', {
        method: 'GET',
        auth: false,
      });
    } catch {
      return { hasPasskeys: false };
    }
  },

  /**
   * Fetch all registered passkeys for current authenticated user
   */
  async listPasskeys(): Promise<PasskeyItem[]> {
    return apiRequest<PasskeyItem[]>('/auth/passkey/list', {
      method: 'GET',
    });
  },

  /**
   * Register a new passkey using browser biometric or security key
   */
  async registerPasskey(name?: string): Promise<PasskeyItem> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn / Passkeys are not supported by this browser or environment.');
    }

    // 1. Request registration options from the worker
    const options = await apiRequest<PublicKeyCredentialCreationOptionsJSON>(
      '/auth/passkey/register-options',
      {
        method: 'POST',
      }
    );

    // 2. Invoke browser / operating system authenticator prompt
    const credential = await startRegistration({ optionsJSON: options });

    // 3. Verify and store credential on server
    const result = await apiRequest<PasskeyItem>('/auth/passkey/register-verify', {
      method: 'POST',
      body: {
        response: credential,
        name: name?.trim() || undefined,
      },
    });

    return result;
  },

  /**
   * Delete / Revoke a passkey
   */
  async deletePasskey(credentialId: string): Promise<void> {
    await apiRequest<{ success: boolean }>(`/auth/passkey/${credentialId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Passwordless sign-in using an enrolled passkey
   */
  async signInWithPasskey(): Promise<AuthSession> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn / Passkeys are not supported on this browser.');
    }

    // 1. Request authentication options from the worker
    const options = await apiRequest<PublicKeyCredentialRequestOptionsJSON>(
      '/auth/passkey/login-options',
      {
        method: 'POST',
        auth: false,
      }
    );

    // 2. Prompt user to select passkey and authenticate with biometric / PIN / key
    const assertion = await startAuthentication({ optionsJSON: options });

    // 3. Send assertion to server for verification
    const session = await apiRequest<AuthSession>('/auth/passkey/login-verify', {
      method: 'POST',
      body: {
        response: assertion,
      },
      auth: false,
    });

    // 4. Save session token
    authService.saveSession(session);
    return session;
  },
};
