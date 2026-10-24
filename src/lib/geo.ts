import { isIP } from 'node:net';

import type { Request } from 'express';

import { logger } from './logger.js';

export type Currency = 'EGP' | 'USD';
export type CountryCode = string;

interface GeoResult {
  country_code?: string;
}

interface CacheEntry {
  countryCode: CountryCode;
  expiresAt: number;
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours
const REQUEST_TIMEOUT_MS = 2000;
const FALLBACK_CURRENCY: Currency = 'USD';

const countryCache = new Map<string, CacheEntry>();

function isLocalIp(ip: string): boolean {
  const normalized = ip.toLowerCase().replace(/^::ffff:/, '');

  return (
    normalized === '::1' ||
    normalized === '127.0.0.1' ||
    normalized.startsWith('127.') ||
    normalized.startsWith('10.') ||
    normalized.startsWith('192.168.') ||
    normalized.startsWith('169.254.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(normalized) ||
    normalized === '0.0.0.0' ||
    normalized === '::'
  );
}

async function getCountryCode(ip: string): Promise<CountryCode | null> {
  const cached = countryCache.get(ip);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.countryCode;
  }

  // Never send a local/private IP to the geolocation provider.
  if (isLocalIp(ip)) {
    return null;
  }

  try {
    const response = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { Accept: 'application/json' },
    });

    logger.info(response);

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as GeoResult;
    const countryCode = data.country_code?.toUpperCase();

    // Require a valid ISO-style, two-letter country code.
    if (!countryCode || !/^[A-Z]{2}$/.test(countryCode)) {
      return null;
    }

    countryCache.set(ip, {
      countryCode,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return countryCode;
  } catch {
    // Network error, timeout, or invalid JSON: pricing still works.
    return null;
  }
}

export async function getCurrency(req: Request): Promise<Currency> {
  const ip = req.ip?.trim();

  if (!ip || isIP(ip) === 0 || isLocalIp(ip)) {
    return FALLBACK_CURRENCY;
  }

  const countryCode = await getCountryCode(ip);

  return countryCode === 'EG' ? 'EGP' : FALLBACK_CURRENCY;
}
