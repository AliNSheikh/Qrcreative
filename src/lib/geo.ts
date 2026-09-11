// Geolocation, country resolution, and device parsing utilities

export interface GeoLocationResult {
  country: string;
  country_code: string;
  city?: string;
  ip?: string;
}

const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  DE: 'Germany',
  FR: 'France',
  JP: 'Japan',
  IN: 'India',
  BR: 'Brazil',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  SE: 'Sweden',
  CH: 'Switzerland',
  SG: 'Singapore',
  AE: 'United Arab Emirates',
  ZA: 'South Africa',
  MX: 'Mexico',
  KR: 'South Korea',
  CN: 'China',
  IE: 'Ireland',
  NZ: 'New Zealand',
  PL: 'Poland',
  BE: 'Belgium',
  AT: 'Austria',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  PT: 'Portugal',
  GR: 'Greece',
  TR: 'Turkey',
  SA: 'Saudi Arabia',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  ID: 'Indonesia',
  MY: 'Malaysia',
  TH: 'Thailand',
  VN: 'Vietnam',
  PH: 'Philippines',
  EG: 'Egypt',
  NG: 'Nigeria',
  KE: 'Kenya',
  IL: 'Israel',
  UA: 'Ukraine',
  CZ: 'Czech Republic',
  RO: 'Romania',
  HU: 'Hungary'
};

// Convert two-letter country code (e.g. "US") to Unicode flag emoji (🇺🇸)
export function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const upper = countryCode.toUpperCase();
  if (upper === 'XX' || upper === 'UNKNOWN') return '🌐';
  try {
    const codePoints = [...upper].map(c => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
}

// Get standardized country name
export function getCountryName(countryCode?: string, fallback = 'Unknown Country'): string {
  if (!countryCode) return fallback;
  const upper = countryCode.toUpperCase();
  return COUNTRY_NAMES[upper] || upper;
}

// Timezone prefix to country code mapping
const TIMEZONE_MAP: Record<string, { code: string; name: string }> = {
  'America/New_York': { code: 'US', name: 'United States' },
  'America/Chicago': { code: 'US', name: 'United States' },
  'America/Denver': { code: 'US', name: 'United States' },
  'America/Los_Angeles': { code: 'US', name: 'United States' },
  'America/Phoenix': { code: 'US', name: 'United States' },
  'America/Toronto': { code: 'CA', name: 'Canada' },
  'America/Vancouver': { code: 'CA', name: 'Canada' },
  'America/Sao_Paulo': { code: 'BR', name: 'Brazil' },
  'America/Mexico_City': { code: 'MX', name: 'Mexico' },
  'America/Buenos_Aires': { code: 'AR', name: 'Argentina' },
  'America/Bogota': { code: 'CO', name: 'Colombia' },
  'America/Santiago': { code: 'CL', name: 'Chile' },
  'Europe/London': { code: 'GB', name: 'United Kingdom' },
  'Europe/Paris': { code: 'FR', name: 'France' },
  'Europe/Berlin': { code: 'DE', name: 'Germany' },
  'Europe/Madrid': { code: 'ES', name: 'Spain' },
  'Europe/Rome': { code: 'IT', name: 'Italy' },
  'Europe/Amsterdam': { code: 'NL', name: 'Netherlands' },
  'Europe/Brussels': { code: 'BE', name: 'Belgium' },
  'Europe/Zurich': { code: 'CH', name: 'Switzerland' },
  'Europe/Vienna': { code: 'AT', name: 'Austria' },
  'Europe/Stockholm': { code: 'SE', name: 'Sweden' },
  'Europe/Oslo': { code: 'NO', name: 'Norway' },
  'Europe/Copenhagen': { code: 'DK', name: 'Denmark' },
  'Europe/Helsinki': { code: 'FI', name: 'Finland' },
  'Europe/Dublin': { code: 'IE', name: 'Ireland' },
  'Europe/Warsaw': { code: 'PL', name: 'Poland' },
  'Europe/Prague': { code: 'CZ', name: 'Czech Republic' },
  'Europe/Athens': { code: 'GR', name: 'Greece' },
  'Europe/Lisbon': { code: 'PT', name: 'Portugal' },
  'Europe/Bucharest': { code: 'RO', name: 'Romania' },
  'Europe/Budapest': { code: 'HU', name: 'Hungary' },
  'Asia/Tokyo': { code: 'JP', name: 'Japan' },
  'Asia/Seoul': { code: 'KR', name: 'South Korea' },
  'Asia/Shanghai': { code: 'CN', name: 'China' },
  'Asia/Hong_Kong': { code: 'HK', name: 'Hong Kong' },
  'Asia/Singapore': { code: 'SG', name: 'Singapore' },
  'Asia/Kolkata': { code: 'IN', name: 'India' },
  'Asia/Calcutta': { code: 'IN', name: 'India' },
  'Asia/Dubai': { code: 'AE', name: 'United Arab Emirates' },
  'Asia/Riyadh': { code: 'SA', name: 'Saudi Arabia' },
  'Asia/Bangkok': { code: 'TH', name: 'Thailand' },
  'Asia/Jakarta': { code: 'ID', name: 'Indonesia' },
  'Asia/Kuala_Lumpur': { code: 'MY', name: 'Malaysia' },
  'Asia/Manila': { code: 'PH', name: 'Philippines' },
  'Asia/Jerusalem': { code: 'IL', name: 'Israel' },
  'Australia/Sydney': { code: 'AU', name: 'Australia' },
  'Australia/Melbourne': { code: 'AU', name: 'Australia' },
  'Pacific/Auckland': { code: 'NZ', name: 'New Zealand' },
  'Africa/Johannesburg': { code: 'ZA', name: 'South Africa' },
  'Africa/Cairo': { code: 'EG', name: 'Egypt' },
  'Africa/Lagos': { code: 'NG', name: 'Nigeria' },
  'Africa/Nairobi': { code: 'KE', name: 'Kenya' }
};

// Fallback detection using browser timezone and locale
export function getFallbackLocation(): GeoLocationResult {
  if (typeof Intl !== 'undefined') {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz && TIMEZONE_MAP[tz]) {
        const item = TIMEZONE_MAP[tz];
        return {
          country: item.name,
          country_code: item.code,
          city: tz.split('/')[1]?.replace(/_/g, ' ')
        };
      }
      // Partial prefix check
      if (tz) {
        for (const [key, val] of Object.entries(TIMEZONE_MAP)) {
          if (tz.startsWith(key.split('/')[0])) {
            return {
              country: val.name,
              country_code: val.code,
              city: tz.split('/')[1]?.replace(/_/g, ' ')
            };
          }
        }
      }
    } catch {
      // Ignored
    }
  }

  // Locale check
  if (typeof navigator !== 'undefined' && navigator.language) {
    const parts = navigator.language.split('-');
    if (parts.length > 1) {
      const code = parts[1].toUpperCase();
      return {
        country: getCountryName(code, 'United States'),
        country_code: code
      };
    }
  }

  return {
    country: 'United States',
    country_code: 'US'
  };
}

let cachedLocation: GeoLocationResult | null = null;

// Detect client location (async with fast fallback)
export async function detectClientLocation(): Promise<GeoLocationResult> {
  if (cachedLocation) {
    return cachedLocation;
  }

  // 1. Try our internal server endpoint first
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const res = await fetch('/api/geo/detect', { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data && data.country_code && data.country_code !== 'XX') {
        cachedLocation = {
          country: data.country || getCountryName(data.country_code),
          country_code: data.country_code.toUpperCase(),
          city: data.city,
          ip: data.ip
        };
        return cachedLocation;
      }
    }
  } catch {
    // Continue to external fallback
  }

  // 2. Try fast public geo IP service (api.country.is)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch('https://api.country.is', { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      if (data && data.country) {
        const code = String(data.country).toUpperCase();
        cachedLocation = {
          country: getCountryName(code),
          country_code: code,
          ip: data.ip
        };
        return cachedLocation;
      }
    }
  } catch {
    // Continue to timezone fallback
  }

  // 3. Fallback to timezone & locale
  cachedLocation = getFallbackLocation();
  return cachedLocation;
}

// Parse user agent into friendly OS and Browser
export function parseClientAgent(ua = ''): { browser: string; os: string } {
  if (!ua && typeof navigator !== 'undefined') {
    ua = navigator.userAgent;
  }

  let os = 'Unknown OS';
  if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Web Browser';
  if (/crios|chrome/i.test(ua) && !/edg/i.test(ua) && !/opr/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/edg/i.test(ua)) browser = 'Edge';
  else if (/opr|opera/i.test(ua)) browser = 'Opera';

  return { browser, os };
}

// Top countries presets for testing and quick simulation
export const COMMON_COUNTRIES = [
  { code: 'US', name: 'United States', city: 'New York' },
  { code: 'GB', name: 'United Kingdom', city: 'London' },
  { code: 'DE', name: 'Germany', city: 'Berlin' },
  { code: 'FR', name: 'France', city: 'Paris' },
  { code: 'JP', name: 'Japan', city: 'Tokyo' },
  { code: 'CA', name: 'Canada', city: 'Toronto' },
  { code: 'AU', name: 'Australia', city: 'Sydney' },
  { code: 'IN', name: 'India', city: 'Mumbai' },
  { code: 'BR', name: 'Brazil', city: 'São Paulo' },
  { code: 'ES', name: 'Spain', city: 'Madrid' },
  { code: 'IT', name: 'Italy', city: 'Rome' },
  { code: 'NL', name: 'Netherlands', city: 'Amsterdam' }
];
