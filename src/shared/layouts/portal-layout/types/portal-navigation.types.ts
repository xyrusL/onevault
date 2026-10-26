import { Icon } from '@phosphor-icons/react';

export type PortalSectionId =
  | 'dashboard'
  | 'projects'
  | 'mail'
  | 'domains'
  | 'tmail'
  | 'two-factor'
  | 'notes'
  | 'settings';

export interface PortalNavItem {
  id: PortalSectionId;
  label: string;
  icon: Icon;
}
