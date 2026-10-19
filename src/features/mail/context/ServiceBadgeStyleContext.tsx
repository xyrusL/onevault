import React, { createContext, useContext, useState } from 'react';
import type { ServiceBadgeStyle } from '../types/mail.types';

interface ServiceBadgeStyleContextValue {
  badgeStyle: ServiceBadgeStyle;
  setBadgeStyle: (style: ServiceBadgeStyle) => void;
}

const STORAGE_KEY = 'onevault.mail.badge-style';

const ServiceBadgeStyleContext = createContext<ServiceBadgeStyleContextValue>({
  badgeStyle: 'icon',
  setBadgeStyle: () => {},
});

export const ServiceBadgeStyleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [badgeStyle, setBadgeStyleState] = useState<ServiceBadgeStyle>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ServiceBadgeStyle;
      if (saved === 'icon' || saved === 'both' || saved === 'name') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'icon'; // Default to Icon Only as requested
  });

  const setBadgeStyle = (newStyle: ServiceBadgeStyle) => {
    setBadgeStyleState(newStyle);
    try {
      localStorage.setItem(STORAGE_KEY, newStyle);
    } catch {
      // ignore
    }
  };

  return (
    <ServiceBadgeStyleContext.Provider value={{ badgeStyle, setBadgeStyle }}>
      {children}
    </ServiceBadgeStyleContext.Provider>
  );
};

export function useServiceBadgeStyle() {
  return useContext(ServiceBadgeStyleContext);
}
