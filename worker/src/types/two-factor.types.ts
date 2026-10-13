export type TotpAlgorithm = 'SHA1' | 'SHA256' | 'SHA512';

export interface TwoFactorTokenRecord {
  id: string;
  issuer: string;
  label: string;
  secret: string;
  algorithm: TotpAlgorithm;
  digits: number;
  period: number;
  otpauth_uri: string;
  created_at: string;
}

export interface TwoFactorTokenDto {
  id: string;
  issuer: string;
  label: string;
  secret: string;
  algorithm: TotpAlgorithm;
  digits: number;
  period: number;
  otpauthUri: string;
  createdAt: string;
}

export interface CreateTwoFactorInput {
  issuer: string;
  label: string;
  secret: string;
  algorithm?: TotpAlgorithm;
  digits?: number;
  period?: number;
  otpauthUri: string;
}
