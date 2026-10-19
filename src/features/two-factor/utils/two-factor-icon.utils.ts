export interface IssuerTheme {
  bg: string;
  border: string;
  text: string;
}

/**
 * Resolves color styling for the badge container surrounding the 2FA icon.
 */
export function resolveIssuerTheme(issuer: string): IssuerTheme {
  const low = (issuer || '').toLowerCase();
  if (low.includes('cloud')) {
    return {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/25',
      text: 'text-orange-400',
    };
  }
  if (low.includes('git')) {
    return {
      bg: 'bg-violet-500/10',
      border: 'border-violet-500/25',
      text: 'text-violet-400',
    };
  }
  if (low.includes('goog')) {
    return {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/25',
      text: 'text-blue-400',
    };
  }
  if (low.includes('disc') || low.includes('slack')) {
    return {
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/25',
      text: 'text-indigo-400',
    };
  }
  if (low.includes('micro') || low.includes('azure')) {
    return {
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/25',
      text: 'text-cyan-400',
    };
  }
  if (low.includes('aws') || low.includes('amazon')) {
    return {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/25',
      text: 'text-amber-400',
    };
  }
  if (low.includes('binance') || low.includes('crypto')) {
    return {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/25',
      text: 'text-yellow-400',
    };
  }
  if (low.includes('proton') || low.includes('pass')) {
    return {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/25',
      text: 'text-purple-400',
    };
  }
  return {
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/25',
    text: 'text-indigo-400',
  };
}

/**
 * Common 2FA provider alias mapping to official Simple Icons slugs.
 */
const ISSUER_SLUG_MAP: Record<string, string> = {
  // Cloud & Hosting
  cloudflare: 'cloudflare',
  aws: 'amazonwebservices',
  amazon: 'amazon',
  'amazon web services': 'amazonwebservices',
  google: 'google',
  microsoft: 'microsoft',
  azure: 'microsoftazure',
  digitalocean: 'digitalocean',
  linode: 'akamai',
  vultr: 'vultr',
  hetzner: 'hetzner',
  ovh: 'ovh',
  heroku: 'heroku',
  vercel: 'vercel',
  netlify: 'netlify',
  supabase: 'supabase',
  render: 'render',
  railway: 'railway',

  // Developer & Version Control
  github: 'github',
  gitlab: 'gitlab',
  bitbucket: 'bitbucket',
  docker: 'docker',
  npm: 'npm',
  pypi: 'pypi',
  stackoverflow: 'stackoverflow',
  sentry: 'sentry',
  datadog: 'datadog',

  // Social & Communication
  discord: 'discord',
  slack: 'slack',
  telegram: 'telegram',
  twitter: 'x',
  x: 'x',
  reddit: 'reddit',
  facebook: 'facebook',
  meta: 'meta',
  instagram: 'instagram',
  linkedin: 'linkedin',
  whatsapp: 'whatsapp',
  signal: 'signal',
  twitch: 'twitch',
  tiktok: 'tiktok',
  youtube: 'youtube',

  // Password Managers & Security
  bitwarden: 'bitwarden',
  '1password': '1password',
  onepassword: '1password',
  lastpass: 'lastpass',
  authy: 'authy',
  dashlane: 'dashlane',
  proton: 'proton',
  protonmail: 'proton',
  tuta: 'tuta',
  tutanota: 'tuta',
  yubico: 'yubico',
  duo: 'duo',

  // Finance & Exchanges
  binance: 'binance',
  coinbase: 'coinbase',
  kraken: 'kraken',
  kucoin: 'kucoin',
  bybit: 'bybit',
  okx: 'okx',
  metamask: 'metamask',
  paypal: 'paypal',
  stripe: 'stripe',
  wise: 'wise',
  revolut: 'revolut',
  robinhood: 'robinhood',

  // Gaming
  roblox: 'roblox',
  steam: 'steam',
  epic: 'epicgames',
  'epic games': 'epicgames',
  playstation: 'playstation',
  sony: 'sony',
  xbox: 'xbox',
  nintendo: 'nintendo',
  ea: 'ea',
  ubisoft: 'ubisoft',
  blizzard: 'battledotnet',
  riot: 'riotgames',
  'riot games': 'riotgames',

  // Productivity, Media & Services
  netflix: 'netflix',
  pinterest: 'pinterest',
  threads: 'threads',
  medium: 'medium',
  notion: 'notion',
  atlassian: 'atlassian',
  jira: 'jira',
  trello: 'trello',
  figma: 'figma',
  canva: 'canva',
  adobe: 'adobe',
  dropbox: 'dropbox',
  zoom: 'zoom',
  spotify: 'spotify',
  apple: 'apple',
  uber: 'uber',
  airbnb: 'airbnb',
  shopify: 'shopify',
  wordpress: 'wordpress',
  openai: 'openai',
  chatgpt: 'openai',
  anthropic: 'anthropic',
  claude: 'anthropic',
  porkbun: 'porkbun',
  namecheap: 'namecheap',
  godaddy: 'godaddy',
};

/**
 * Brands whose primary icon is black (#000000) or very dark,
 * which should be rendered white in dark mode.
 */
const MONOCHROME_DARK_BRANDS = new Set([
  'github',
  'x',
  'apple',
  'steam',
  'openai',
  'nextdotjs',
  'vercel',
  'notion',
  'threads',
  'tiktok',
  'uber',
  'sony',
  'roblox',
  'auth0',
  'claude',
  'anthropic',
  'medium',
  'square',
]);

/**
 * Automatically detects the Simple Icons slug from any 2FA issuer string.
 */
export function resolveSimpleIconSlug(rawIssuer: string): string {
  if (!rawIssuer) return '';
  const clean = rawIssuer.toLowerCase().trim();

  // 1. Direct match
  if (ISSUER_SLUG_MAP[clean]) {
    return ISSUER_SLUG_MAP[clean];
  }

  // 2. Exact match in keys or values
  for (const [key, slug] of Object.entries(ISSUER_SLUG_MAP)) {
    if (clean === key || clean === slug) {
      return slug;
    }
  }

  // 3. Word token matching (e.g. "Cloudflare Access" -> "cloudflare", "GitHub - Work" -> "github")
  // Safely prevents false substring matches like "Roblox" matching "x" or "Steam" matching "ea"
  const words = clean.split(/[^a-z0-9]+/).filter(Boolean);
  for (const word of words) {
    if (ISSUER_SLUG_MAP[word]) {
      return ISSUER_SLUG_MAP[word];
    }
  }

  // 4. Multi-word phrase matching (only for keys with 4 or more characters)
  for (const [key, slug] of Object.entries(ISSUER_SLUG_MAP)) {
    if (key.length >= 4 && clean.includes(key)) {
      return slug;
    }
  }

  // 5. Fallback: sanitized alphanumeric slug
  return clean.replace(/[^a-z0-9]/g, '');
}

/**
 * Returns the Simple Icons CDN URL for the given issuer with smart dark/light color handling.
 * Avoids ?viewbox=auto to preserve the canonical 24x24 optical weight grid designed by Simple Icons.
 */
export function getSimpleIconUrl(rawIssuer: string, isDark: boolean): string {
  const slug = resolveSimpleIconSlug(rawIssuer);
  if (!slug) return '';

  if (isDark && MONOCHROME_DARK_BRANDS.has(slug)) {
    return `https://cdn.simpleicons.org/${slug}/ffffff`;
  }

  return `https://cdn.simpleicons.org/${slug}`;
}
