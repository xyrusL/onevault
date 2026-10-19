import React, { useEffect, useState } from 'react';
import { ShieldCheck } from '@phosphor-icons/react';
import { useTheme } from '../../../theme';
import { getSimpleIconUrl } from '../utils/two-factor-icon.utils';

interface TwoFactorIssuerIconProps {
  issuer: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TwoFactorIssuerIcon: React.FC<TwoFactorIssuerIconProps> = ({
  issuer,
  size = 'md',
  className = '',
}) => {
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [hasError, setHasError] = useState(false);

  const iconUrl = getSimpleIconUrl(issuer, isDark);

  // Reset error state if the issuer changes
  useEffect(() => {
    setHasError(false);
  }, [issuer, isDark]);

  const sizeDimensions = {
    sm: { px: 13, cls: 'h-3.5 w-3.5' },
    md: { px: 16, cls: 'h-4 w-4' },
    lg: { px: 20, cls: 'h-5 w-5' },
  }[size];

  if (!iconUrl || hasError) {
    return (
      <ShieldCheck
        size={sizeDimensions.px}
        weight="duotone"
        className={`shrink-0 ${className}`}
      />
    );
  }

  return (
    <img
      src={iconUrl}
      alt={`${issuer} logo`}
      loading="lazy"
      onError={() => setHasError(true)}
      className={`${sizeDimensions.cls} object-contain shrink-0 transition-opacity duration-150 ${className}`}
    />
  );
};
