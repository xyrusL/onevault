export type TwoFactorInputMethod = 'qr-image' | 'manual-url';

export interface TwoFactorTokenItem {
  id: string;
  issuer: string;
  label: string;
  secret: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: number;
  period: number;
  otpauthUri: string;
  createdDate: string;
  createdTime: string;
}

export interface CreateTwoFactorPayload {
  issuer: string;
  label: string;
  secret: string;
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: number;
  period: number;
  otpauthUri: string;
}

export interface LiveTotpCode {
  formattedCode: string;
  rawCode: string;
  remainingSeconds: number;
  progressPercent: number;
}
