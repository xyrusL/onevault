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
 * Known mapping of services/issuers to their canonical web domains for secondary favicon retrieval.
 */
const BRAND_DOMAIN_MAP: Record<string, string> = {
  chatgpt: 'chatgpt.com',
  openai: 'openai.com',
  anthropic: 'anthropic.com',
  claude: 'claude.ai',
  github: 'github.com',
  gitlab: 'gitlab.com',
  bitbucket: 'bitbucket.org',
  google: 'google.com',
  youtube: 'youtube.com',
  gmail: 'gmail.com',
  microsoft: 'microsoft.com',
  azure: 'azure.microsoft.com',
  apple: 'apple.com',
  icloud: 'icloud.com',
  amazon: 'amazon.com',
  aws: 'aws.amazon.com',
  facebook: 'facebook.com',
  meta: 'meta.com',
  instagram: 'instagram.com',
  threads: 'threads.net',
  twitter: 'x.com',
  x: 'x.com',
  linkedin: 'linkedin.com',
  reddit: 'reddit.com',
  tiktok: 'tiktok.com',
  spotify: 'spotify.com',
  netflix: 'netflix.com',
  discord: 'discord.com',
  slack: 'slack.com',
  telegram: 'telegram.org',
  whatsapp: 'whatsapp.com',
  signal: 'signal.org',
  steam: 'steampowered.com',
  epicgames: 'epicgames.com',
  playstation: 'playstation.com',
  xbox: 'xbox.com',
  nintendo: 'nintendo.com',
  twitch: 'twitch.tv',
  cloudflare: 'cloudflare.com',
  digitalocean: 'digitalocean.com',
  linode: 'linode.com',
  vultr: 'vultr.com',
  hetzner: 'hetzner.com',
  vercel: 'vercel.com',
  netlify: 'netlify.com',
  supabase: 'supabase.com',
  docker: 'docker.com',
  npm: 'npmjs.com',
  figma: 'figma.com',
  notion: 'notion.so',
  canva: 'canva.com',
  adobe: 'adobe.com',
  zoom: 'zoom.us',
  dropbox: 'dropbox.com',
  uber: 'uber.com',
  airbnb: 'airbnb.com',
  paypal: 'paypal.com',
  stripe: 'stripe.com',
  binance: 'binance.com',
  coinbase: 'coinbase.com',
  kraken: 'kraken.com',
  dribbble: 'dribbble.com',
  behance: 'behance.net',
  medium: 'medium.com',
  substack: 'substack.com',
  pinterest: 'pinterest.com',
  shopify: 'shopify.com',
  wordpress: 'wordpress.com',
  porkbun: 'porkbun.com',
  namecheap: 'namecheap.com',
  godaddy: 'godaddy.com',
  bitwarden: 'bitwarden.com',
  '1password': '1password.com',
  proton: 'proton.me',
  tuta: 'tuta.com',
};

/**
 * Resolves canonical domain name for an issuer or service tag to query live favicon CDNs.
 */
export function resolveBrandDomain(rawName: string): string {
  if (!rawName) return '';
  const clean = rawName.toLowerCase().trim();

  // 1. If already a domain name
  if (clean.includes('.')) {
    return clean;
  }

  // 2. Direct map lookup
  if (BRAND_DOMAIN_MAP[clean]) {
    return BRAND_DOMAIN_MAP[clean];
  }

  // 3. Token match
  const words = clean.split(/[^a-z0-9]+/).filter(Boolean);
  for (const word of words) {
    if (BRAND_DOMAIN_MAP[word]) {
      return BRAND_DOMAIN_MAP[word];
    }
  }

  // 4. Fallback: sanitized name + .com
  const sanitized = clean.replace(/[^a-z0-9]/g, '');
  return sanitized ? `${sanitized}.com` : '';
}

/**
 * Returns an ordered array of candidate icon URLs:
 * 1. Primary Source: Simple Icons CDN (Vector SVG)
 * 2. Secondary Source: Google Favicon V2 (High-Res 64x64 PNG from live domain)
 * 3. Tertiary Source: DuckDuckGo Favicon CDN (WebP / ICO)
 */
export function getBrandIconCandidates(
  rawName: string,
  isDark: boolean,
  customDomain?: string
): string[] {
  const candidates: string[] = [];
  const clean = (rawName || '').trim();
  if (!clean) return candidates;

  // 1. Primary Source: Simple Icons CDN (Vector SVG)
  const slug = resolveSimpleIconSlug(clean);
  if (slug) {
    if (isDark && MONOCHROME_DARK_BRANDS.has(slug)) {
      candidates.push(`https://cdn.simpleicons.org/${slug}/ffffff`);
    } else {
      candidates.push(`https://cdn.simpleicons.org/${slug}`);
    }
  }

  // 2. Secondary Source: Google Favicons V2 (High-Res live domain favicon)
  const domain = customDomain || resolveBrandDomain(clean);
  if (domain) {
    candidates.push(
      `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=64`
    );

    // 3. Tertiary Source: DuckDuckGo Favicon CDN
    candidates.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
  }

  return candidates;
}

/**
 * Returns the Simple Icons CDN URL for the given issuer with smart dark/light color handling.
 * Avoids ?viewbox=auto to preserve the canonical 24x24 optical weight grid designed by Simple Icons.
 */
export function getSimpleIconUrl(rawIssuer: string, isDark: boolean): string {
  const candidates = getBrandIconCandidates(rawIssuer, isDark);
  return candidates[0] || '';
}
