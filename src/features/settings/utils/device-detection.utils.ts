/**
 * Detect current platform and browser for suggested passkey name
 */
export function getDefaultDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Passkey Device';

  const ua = navigator.userAgent;
  let os = 'Device';
  let browser = 'Browser';

  // Detect OS
  if (/Windows/i.test(ua)) {
    os = 'Windows PC';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'MacBook / Mac';
  } else if (/iPhone/i.test(ua)) {
    os = 'iPhone';
  } else if (/iPad/i.test(ua)) {
    os = 'iPad';
  } else if (/Android/i.test(ua)) {
    os = 'Android Device';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux PC';
  }

  // Detect Browser
  if (/Edg\//i.test(ua)) {
    browser = 'Edge';
  } else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox\//i.test(ua)) {
    browser = 'Firefox';
  } else if (/Brave/i.test(ua)) {
    browser = 'Brave';
  }

  return `${os} (${browser})`;
}

export type DevicePlatform = 'windows' | 'apple' | 'android' | 'linux' | 'mobile' | 'desktop' | 'key';

export function parseDevicePlatform(userAgent?: string, deviceType?: string): {
  platform: DevicePlatform;
  label: string;
} {
  if (!userAgent) {
    if (deviceType === 'singleDevice') {
      return { platform: 'key', label: 'Security Key' };
    }
    return { platform: 'desktop', label: 'Passkey Device' };
  }

  const ua = userAgent;

  if (/iPhone|iPad/i.test(ua)) {
    return { platform: 'apple', label: /iPad/i.test(ua) ? 'Apple iPad' : 'Apple iPhone' };
  }
  if (/Macintosh|Mac OS X/i.test(ua)) {
    return { platform: 'apple', label: 'macOS Device' };
  }
  if (/Android/i.test(ua)) {
    return { platform: 'android', label: 'Android Device' };
  }
  if (/Windows/i.test(ua)) {
    return { platform: 'windows', label: 'Windows PC' };
  }
  if (/Linux/i.test(ua)) {
    return { platform: 'linux', label: 'Linux Workstation' };
  }

  return { platform: 'desktop', label: 'Desktop / Authenticator' };
}
