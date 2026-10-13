import {
  EnvelopeSimple,
  GearSix,
  Globe,
  Key,
  NotePencil,
  SquaresFour,
} from '@phosphor-icons/react';
import { PortalNavItem } from '../types/portal-navigation.types';

export const PORTAL_NAV_ITEMS: PortalNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: SquaresFour,
  },
  {
    id: 'mail',
    label: 'Mail',
    icon: EnvelopeSimple,
  },
  {
    id: 'domains',
    label: 'Domains',
    icon: Globe,
  },
  {
    id: 'two-factor',
    label: '2FA',
    icon: Key,
  },
  {
    id: 'notes',
    label: 'Note',
    icon: NotePencil,
  },
  {
    id: 'settings',
    label: 'Setting',
    icon: GearSix,
  },
];
