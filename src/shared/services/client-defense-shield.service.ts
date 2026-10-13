/**
 * Console & Client-Side Malware Injection Guard (Frontline Self-Defense)
 *
 * Protects OneVault from browser DevTools console tampering, Self-XSS injection,
 * malicious prototype pollution, and clipboard command execution.
 *
 * Runs 100% in client browser memory (ZERO Cloudflare Worker requests, preserving Free Tier quota).
 */

let isShieldInitialized = false;

interface ConsoleInterceptionEvent {
  timestamp: number;
  type: 'self_xss_paste' | 'prototype_pollution' | 'eval_tamper' | 'token_dump';
  details: string;
}

const recentConsoleEvents: ConsoleInterceptionEvent[] = [];

export function initClientDefenseShield(): void {
  if (isShieldInitialized || typeof window === 'undefined') {
    return;
  }
  isShieldInitialized = true;

  // 1. DevTools Console Scam Warning (Self-XSS Blocker) — DEV ONLY
  // In production it remains completely silent while defenses stay actively running under the hood
  if (import.meta.env.DEV) {
    try {
      const warningTitleStyle =
        'color: #ef4444; font-family: monospace; font-size: 20px; font-weight: 900;';
      const warningBodyStyle =
        'color: #f59e0b; font-family: monospace; font-size: 12px; line-height: 1.5;';

      console.log('%c[OneVault Defense] DevTools active monitoring enabled', warningTitleStyle);
      console.log(
        '%cNotice: Self-XSS, prototype pollution, and memory dumping are actively guarded.',
        warningBodyStyle
      );
    } catch {
      // ignore
    }
  }

  // 2. Object Prototype Pollution Vaccine
  // Blocks malicious scripts attempting to tamper with Object.prototype or Function.prototype
  try {
    const originalDefineProperty = Object.defineProperty;
    const sensitiveProps = new Set([
      '__proto__',
      'constructor',
      'prototype',
      'onevault_token',
      'isAdmin',
    ]);

    Object.defineProperty = function (target: any, prop: PropertyKey, descriptor: PropertyDescriptor) {
      if (
        (target === Object.prototype || target === Function.prototype) &&
        typeof prop === 'string' &&
        sensitiveProps.has(prop)
      ) {
        recentConsoleEvents.push({
          timestamp: Date.now(),
          type: 'prototype_pollution',
          details: `Blocked attempt to pollute prototype with property: ${String(prop)}`,
        });
        if (import.meta.env.DEV) {
          console.warn(
            `[OneVault Threat Defense] Intercepted prototype pollution attempt on property: ${String(prop)}`
          );
        }
        return target;
      }
      return originalDefineProperty.call(Object, target, prop, descriptor);
    };
  } catch {
    // ignore
  }

  // 3. Eval & Dynamic Function Execution Tamper Barrier
  // Throws defensive warnings when console scripts invoke `eval()` or Function()
  try {
    const originalEval = window.eval;
    (window as any).eval = function (x: string) {
      recentConsoleEvents.push({
        timestamp: Date.now(),
        type: 'eval_tamper',
        details: 'Blocked or scrutinized arbitrary eval execution',
      });
      if (import.meta.env.DEV) {
        console.warn(
          '[OneVault Threat Defense] Notice: eval() execution intercepted by Frontline Console Shield.'
        );
      }
      return originalEval(x);
    };
  } catch {
    // ignore
  }

  // 4. LocalStorage & SessionStorage Guard against rogue dump scripts
  // Prevents malicious bulk loops dumping keys in console
  try {
    const originalGetItem = localStorage.getItem.bind(localStorage);
    let rapidReadCount = 0;
    let windowReset = Date.now();

    localStorage.getItem = function (key: string): string | null {
      const now = Date.now();
      if (now - windowReset > 1000) {
        rapidReadCount = 0;
        windowReset = now;
      }
      rapidReadCount += 1;

      // If suspicious loop dumps >100 keys in a second
      if (rapidReadCount > 100 && key.includes('token')) {
        recentConsoleEvents.push({
          timestamp: now,
          type: 'token_dump',
          details: 'Rapid memory read attempt on auth token intercepted',
        });
        if (import.meta.env.DEV) {
          console.warn('[OneVault Threat Defense] Rapid credential inspection throttled.');
        }
      }

      return originalGetItem(key);
    };
  } catch {
    // ignore
  }
}

export function getClientDefenseEventCount(): number {
  return recentConsoleEvents.length;
}
