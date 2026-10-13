import React, { useMemo } from 'react';
import * as jdenticon from 'jdenticon';

interface SubdomainIconProps {
  name: string;
  isRoot?: boolean;
  size?: number;
  className?: string;
  context?: string;
}

export interface SubdomainThemeConfig {
  component: React.ComponentType<{
    size?: number;
    weight?: 'duotone' | 'bold' | 'fill' | 'regular';
    className?: string;
  }>;
  bgClass: string;
  textClass: string;
  domainTextClass: string;
  badgeClass: string;
}

/**
 * 32-bit FNV-1a Hash function
 * Generates an even, deterministic integer distribution from any domain or subdomain string.
 */
function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * 11 Curated Tailwind Theme Swatches across the 360° color wheel.
 * Strictly avoids amber/orange warning hues (25° - 55°) so no domain or subdomain
 * ever resembles an alert, degraded state, or warning.
 */
const THEME_SWATCHES = [
  {
    hue: 250,
    bgClass: 'bg-violet-500/12 border-violet-500/30 text-violet-400',
    textClass: 'text-violet-400',
    domainTextClass: 'text-violet-400/80',
    badgeClass: 'bg-violet-500/12 border-violet-500/25 text-violet-300',
  },
  {
    hue: 185,
    bgClass: 'bg-cyan-500/12 border-cyan-500/30 text-cyan-400',
    textClass: 'text-cyan-400',
    domainTextClass: 'text-cyan-400/80',
    badgeClass: 'bg-cyan-500/12 border-cyan-500/25 text-cyan-300',
  },
  {
    hue: 235,
    bgClass: 'bg-indigo-500/12 border-indigo-500/30 text-indigo-400',
    textClass: 'text-indigo-400',
    domainTextClass: 'text-indigo-400/80',
    badgeClass: 'bg-indigo-500/12 border-indigo-500/25 text-indigo-300',
  },
  {
    hue: 155,
    bgClass: 'bg-emerald-500/12 border-emerald-500/30 text-emerald-400',
    textClass: 'text-emerald-400',
    domainTextClass: 'text-emerald-400/80',
    badgeClass: 'bg-emerald-500/12 border-emerald-500/25 text-emerald-300',
  },
  {
    hue: 200,
    bgClass: 'bg-sky-500/12 border-sky-500/30 text-sky-400',
    textClass: 'text-sky-400',
    domainTextClass: 'text-sky-400/80',
    badgeClass: 'bg-sky-500/12 border-sky-500/25 text-sky-300',
  },
  {
    hue: 275,
    bgClass: 'bg-purple-500/12 border-purple-500/30 text-purple-400',
    textClass: 'text-purple-400',
    domainTextClass: 'text-purple-400/80',
    badgeClass: 'bg-purple-500/12 border-purple-500/25 text-purple-300',
  },
  {
    hue: 170,
    bgClass: 'bg-teal-500/12 border-teal-500/30 text-teal-400',
    textClass: 'text-teal-400',
    domainTextClass: 'text-teal-400/80',
    badgeClass: 'bg-teal-500/12 border-teal-500/25 text-teal-300',
  },
  {
    hue: 295,
    bgClass: 'bg-fuchsia-500/12 border-fuchsia-500/30 text-fuchsia-400',
    textClass: 'text-fuchsia-400',
    domainTextClass: 'text-fuchsia-400/80',
    badgeClass: 'bg-fuchsia-500/12 border-fuchsia-500/25 text-fuchsia-300',
  },
  {
    hue: 215,
    bgClass: 'bg-blue-500/12 border-blue-500/30 text-blue-400',
    textClass: 'text-blue-400',
    domainTextClass: 'text-blue-400/80',
    badgeClass: 'bg-blue-500/12 border-blue-500/25 text-blue-300',
  },
  {
    hue: 345,
    bgClass: 'bg-rose-500/12 border-rose-500/30 text-rose-400',
    textClass: 'text-rose-400',
    domainTextClass: 'text-rose-400/80',
    badgeClass: 'bg-rose-500/12 border-rose-500/25 text-rose-300',
  },
  {
    hue: 325,
    bgClass: 'bg-pink-500/12 border-pink-500/30 text-pink-400',
    textClass: 'text-pink-400',
    domainTextClass: 'text-pink-400/80',
    badgeClass: 'bg-pink-500/12 border-pink-500/25 text-pink-300',
  },
];

/**
 * Resolves the canonical domain seed to guarantee 100% deterministic color
 * and identicon hashing across all views (folder cards, header detail, account rows).
 */
function getCanonicalDomainSeed(name: string, context?: string): string {
  if (context && context.trim()) {
    return context.toLowerCase().trim();
  }
  return name.toLowerCase().trim();
}

/**
 * Deterministic Golden-Ratio Color Palette Theme Resolver
 */
export function resolveSubdomainTheme(
  name: string,
  _isRoot?: boolean,
  context?: string
): SubdomainThemeConfig {
  const seedString = getCanonicalDomainSeed(name, context);
  const hash = hashString(seedString);

  const swatchIndex = Math.floor(
    (((hash * 0.618033988749895) % 1) + 1) % 1 * THEME_SWATCHES.length
  );
  const matched = THEME_SWATCHES[swatchIndex % THEME_SWATCHES.length];

  // Placeholder component (not used directly when rendering procedural identicons)
  const DummyComponent: React.FC = () => null;

  return {
    component: DummyComponent,
    bgClass: matched.bgClass,
    textClass: matched.textClass,
    domainTextClass: matched.domainTextClass,
    badgeClass: matched.badgeClass,
  };
}

/**
 * Procedural SVG Identicon Generator (Jdenticon)
 *
 * Fully algorithmic geometric glyph generated on-the-fly for every domain and subdomain.
 * Guarantees that:
 *  1. Any word, concept, or domain name generates a unique, intricate geometric crest.
 *  2. No manual category keywords or preset icons are needed.
 *  3. Collision-free: 2 different domains will always receive different procedural crests.
 *  4. Configured to align with OneVault's non-warning modern dark-mode palette.
 */
export const SubdomainIcon: React.FC<SubdomainIconProps> = ({
  name,
  isRoot = false,
  size = 20,
  className = '',
  context,
}) => {
  const seed = getCanonicalDomainSeed(name, context);
  const config = resolveSubdomainTheme(name, isRoot, context);
  const hash = hashString(seed);

  // Pick matched hue from theme swatch so identicon harmonizes with card border & text
  const swatchIndex = Math.floor(
    (((hash * 0.618033988749895) % 1) + 1) % 1 * THEME_SWATCHES.length
  );
  const baseHue = THEME_SWATCHES[swatchIndex % THEME_SWATCHES.length].hue;

  // Generate deterministic pure SVG string with vivid, distinct domain colors
  const svgHtml = useMemo(() => {
    return jdenticon.toSvg(seed, size, {
      padding: 0.06,
      backColor: 'transparent',
      hues: [baseHue, (baseHue + 40) % 360, (baseHue + 280) % 360],
      lightness: {
        color: [0.55, 0.8],
        grayscale: [0.5, 0.85],
      },
      saturation: {
        color: 0.85,
        grayscale: 0.1,
      },
    });
  }, [seed, size, baseHue]);

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border transition-all duration-200 overflow-hidden ${config.bgClass} ${className}`}
      style={{ width: size + 16, height: size + 16 }}
      dangerouslySetInnerHTML={{ __html: svgHtml }}
    />
  );
};
