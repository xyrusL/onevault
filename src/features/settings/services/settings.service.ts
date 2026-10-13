import { apiRequest } from '../../../shared/services/api-client.service';
import { authService } from '../../auth/services/auth.service';
import type {
  AdminAccount,
  ImportSummary,
  UpdateAccountPayload,
  UpdateAccountResponse,
  VaultExportData,
  VaultStats,
} from '../types/settings.types';

export const settingsService = {
  /** Fetch current authenticated admin account profile */
  async getAccount(): Promise<AdminAccount> {
    return apiRequest<AdminAccount>('/auth/account');
  },

  /** Update administrator email and/or password with current password verification */
  async updateAccount(payload: UpdateAccountPayload): Promise<UpdateAccountResponse> {
    const res = await apiRequest<UpdateAccountResponse>('/auth/account', {
      method: 'PATCH',
      body: payload,
    });

    if (res.token && res.email) {
      authService.saveSession({
        token: res.token,
        email: res.email,
      });
    }

    return res;
  },

  /** Get stats breakdown of items across all collections */
  async getVaultStats(): Promise<VaultStats> {
    return apiRequest<VaultStats>('/backup/stats');
  },

  /** Export the entire raw vault data payload from the server */
  async exportVaultData(): Promise<VaultExportData> {
    return apiRequest<VaultExportData>('/backup/export');
  },

  /** Submit vault collections to server for timestamp-based smart merge */
  async importVaultData(data: VaultExportData): Promise<ImportSummary> {
    return apiRequest<ImportSummary>('/backup/import', {
      method: 'POST',
      body: { data },
    });
  },
};
