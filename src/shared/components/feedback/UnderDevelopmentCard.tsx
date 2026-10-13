import React from 'react';
import { Wrench } from '@phosphor-icons/react';

interface UnderDevelopmentCardProps {
  moduleName: string;
  description: string;
  icon?: React.ReactNode;
}

export const UnderDevelopmentCard: React.FC<UnderDevelopmentCardProps> = ({
  moduleName,
  description,
  icon,
}) => {
  return (
    <div className="rounded-xl bg-surface backdrop-blur-xl border border-default shadow-card p-6 flex flex-col items-center justify-center text-center min-h-[260px]">
      <div className="mb-3.5 flex h-11 w-11 items-center justify-center rounded-xl bg-elevated border border-default text-fg-primary shadow-xs">
        {icon ?? <Wrench size={20} weight="duotone" />}
      </div>

      <span className="inline-flex items-center gap-1.5 rounded-full bg-elevated border border-default px-2.5 py-0.5 font-mono text-xs font-medium uppercase tracking-wider text-fg-secondary mb-2">
        <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
        Under Development
      </span>

      <h2 className="font-display text-lg font-semibold tracking-tight text-fg-primary">
        {moduleName}
      </h2>

      <p className="mt-1 max-w-md text-sm text-fg-secondary leading-relaxed">
        {description}
      </p>
    </div>
  );
};
