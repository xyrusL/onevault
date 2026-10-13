import React from 'react';

interface OneVaultLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

/**
 * OneVaultLogo
 *
 * Renders the transparent hexagonal OneVault logo image (`/logo.png`) with no
 * background box or white border.
 */
export const OneVaultLogo: React.FC<OneVaultLogoProps> = ({
  size = 'md',
  className = '',
}) => {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center transition-transform duration-300 hover:scale-105 ${SIZE_CLASSES[size]} ${className}`}
    >
      <img
        src="/logo.png"
        alt="OneVault Logo"
        className="h-full w-full object-contain drop-shadow-xs"
      />
    </div>
  );
};
