import React, { useMemo, useRef, useState } from 'react';
import {
  CheckCircle,
  Key,
  LinkSimple,
  QrCode,
  UploadSimple,
  WarningCircle,
} from '@phosphor-icons/react';
import { CustomSelect, SelectOption } from '../../../shared/components/forms';
import { twoFactorService } from '../services/two-factor.service';
import {
  CreateTwoFactorPayload,
  TwoFactorInputMethod,
  TwoFactorTokenItem,
} from '../types/two-factor.types';

interface CreateTwoFactorModalContentProps {
  onCancel: () => void;
  onCreate: (payload: CreateTwoFactorPayload) => Promise<void>;
}

export const CreateTwoFactorModalContent: React.FC<
  CreateTwoFactorModalContentProps
> = ({ onCancel, onCreate }) => {
  const [method, setMethod] = useState<TwoFactorInputMethod>('qr-image');
  const [isDragging, setIsDragging] = useState(false);
  const [qrFileName, setQrFileName] = useState<string | null>(null);

  const [manualInput, setManualInput] = useState('');
  const [issuerInput, setIssuerInput] = useState('');
  const [labelInput, setLabelInput] = useState('');

  const [decodedToken, setDecodedToken] = useState<TwoFactorTokenItem | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const methodOptions = useMemo<SelectOption<TwoFactorInputMethod>[]>(
    () => [
      {
        value: 'qr-image',
        label: 'Drop QR Code Image',
      },
      {
        value: 'manual-url',
        label: 'Enter 2FA URL | Secret Key',
      },
    ],
    []
  );

  const handleMethodChange = (nextMethod: TwoFactorInputMethod) => {
    setMethod(nextMethod);
    setErrorMessage(null);
    setDecodedToken(null);
    setQrFileName(null);
    setIssuerInput('');
    setLabelInput('');
  };

  const processQrFile = async (file: File) => {
    setErrorMessage(null);
    setQrFileName(file.name);
    try {
      const rawQrData = await twoFactorService.decodeQrImageFile(file);
      const token = twoFactorService.parseOtpInput(rawQrData);
      setDecodedToken(token);
      // Automatically fill Service Name and Account / Email from detected QR
      setIssuerInput(token.issuer);
      setLabelInput(token.label);
    } catch (err) {
      setDecodedToken(null);
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to decode QR code image.'
      );
    }
  };

  const handleManualInputChange = (value: string) => {
    setManualInput(value);
    setErrorMessage(null);

    if (value.trim().length >= 8) {
      try {
        const detected = twoFactorService.parseOtpInput(value);
        setDecodedToken(detected);
        // Automatically populate Service Name and Account / Email when detected
        setIssuerInput(detected.issuer);
        setLabelInput(detected.label);
      } catch {
        setDecodedToken(null);
      }
    } else {
      setDecodedToken(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processQrFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void processQrFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      let token: TwoFactorTokenItem;
      if (method === 'qr-image') {
        if (!decodedToken) {
          setErrorMessage('Please drop or select a valid 2FA QR code image.');
          return;
        }
        token = {
          ...decodedToken,
          issuer: issuerInput.trim() || decodedToken.issuer,
          label: labelInput.trim() || decodedToken.label,
        };
      } else {
        token = twoFactorService.parseOtpInput(
          manualInput,
          issuerInput,
          labelInput
        );
      }

      setIsSubmitting(true);
      await onCreate({
        issuer: token.issuer,
        label: token.label,
        secret: token.secret,
        algorithm: token.algorithm,
        digits: token.digits,
        period: token.period,
        otpauthUri: token.otpauthUri,
      });
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Invalid 2FA input.'
      );
      setIsSubmitting(false);
    }
  };

  const livePreview = useMemo(() => {
    if (!decodedToken) return null;
    try {
      return twoFactorService.generateLiveCode(decodedToken);
    } catch {
      return null;
    }
  }, [decodedToken]);

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      {/* Step 1: Select Method via Shared CustomSelect */}
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-fg-secondary">
          Select Import Method
        </label>
        <CustomSelect<TwoFactorInputMethod>
          value={method}
          options={methodOptions}
          onChange={handleMethodChange}
          icon={
            method === 'qr-image' ? (
              <QrCode size={14} weight="duotone" />
            ) : (
              <LinkSimple size={14} weight="bold" />
            )
          }
        />
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg bg-elevated border border-default px-3 py-2 text-xs font-medium text-danger"
        >
          <WarningCircle size={15} weight="fill" className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Method A: Drop QR Code Image */}
      {method === 'qr-image' && (
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className={`flex flex-col items-center justify-center rounded-xl border border-dashed p-5 text-center transition-all duration-200 cursor-pointer ${
              isDragging
                ? 'border-focus bg-elevated scale-[0.99]'
                : decodedToken
                ? 'border-strong bg-elevated/60'
                : 'border-default bg-elevated/30 hover:bg-elevated/60 hover:border-strong'
            }`}
          >
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-surface-solid border border-default text-fg-primary">
              {decodedToken ? (
                <CheckCircle
                  size={18}
                  weight="duotone"
                  className="text-success"
                />
              ) : (
                <UploadSimple size={18} weight="duotone" />
              )}
            </div>

            <p className="text-xs font-medium text-fg-primary">
              {qrFileName
                ? `Loaded: ${qrFileName}`
                : 'Drop 2FA QR image here, or click to browse'}
            </p>
            <p className="mt-1 text-xs text-fg-muted">
              Service name and account will auto-fill once detected
            </p>
          </div>
        </div>
      )}

      {/* Method B: Manual otpauth:// URL or Secret Key */}
      {method === 'manual-url' && (
        <div className="space-y-1.5">
          <label
            htmlFor="otp-manual-url"
            className="block text-xs font-medium text-fg-secondary"
          >
            2FA URL | Base32 Secret Key
          </label>
          <div className="relative flex items-center">
            <span className="pointer-events-none absolute left-3 inline-flex items-center justify-center text-fg-muted">
              <Key size={14} weight="duotone" />
            </span>
            <input
              id="otp-manual-url"
              type="text"
              required
              value={manualInput}
              onChange={(e) => handleManualInputChange(e.target.value)}
              placeholder="otpauth://totp/GitHub:user?secret=JBSWY3DPEHPK3PXP..."
              className="w-full rounded-md bg-input hover:bg-input-hover focus:bg-surface-solid pl-8 pr-3 py-2 font-mono text-xs text-fg-primary placeholder:text-fg-placeholder border border-default focus:border-focus focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Auto-Populated Service Name & Account | Email */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="space-y-1">
          <label
            htmlFor="otp-issuer"
            className="block text-xs font-medium text-fg-secondary"
          >
            Service Name
          </label>
          <input
            id="otp-issuer"
            type="text"
            value={issuerInput}
            onChange={(e) => setIssuerInput(e.target.value)}
            placeholder="Auto-filled on detect"
            className="w-full rounded-md bg-input hover:bg-input-hover focus:bg-surface-solid px-2.5 py-1.5 text-xs text-fg-primary placeholder:text-fg-placeholder border border-default focus:border-focus focus:outline-none"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="otp-label"
            className="block text-xs font-medium text-fg-secondary"
          >
            Account | Email
          </label>
          <input
            id="otp-label"
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="Auto-filled on detect"
            className="w-full rounded-md bg-input hover:bg-input-hover focus:bg-surface-solid px-2.5 py-1.5 text-xs text-fg-primary placeholder:text-fg-placeholder border border-default focus:border-focus focus:outline-none"
          />
        </div>
      </div>

      {/* Live Generated TOTP Preview Banner */}
      {livePreview && (
        <div className="rounded-lg bg-elevated border border-default px-3 py-2 flex items-center justify-between gap-2">
          <span className="text-xs text-fg-muted leading-none">
            Live Generated Code
          </span>
          <span className="font-mono text-xs font-semibold tracking-wider text-success leading-none">
            {livePreview.formattedCode} ({livePreview.remainingSeconds}s)
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-subtle">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md border border-default bg-elevated px-3 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary disabled:opacity-60 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md bg-accent hover:bg-accent-hover text-accent-fg px-3.5 py-1.5 text-xs font-semibold shadow-xs disabled:opacity-60 cursor-pointer"
        >
          {isSubmitting ? 'Saving...' : 'Save 2FA'}
        </button>
      </div>
    </form>
  );
};
