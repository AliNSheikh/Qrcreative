/// <reference types="vite/client" />

export interface RuntimeConfig {
  siteUrl: string;
  detectedOrigin: string;
  supabase: {
    url: string;
    anonKey: string;
    isConfigured: boolean;
  };
}

const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
const procEnv = typeof process !== 'undefined' ? process.env : undefined;

const staticSiteUrl =
  metaEnv?.VITE_SITE_URL ||
  metaEnv?.NEXT_PUBLIC_SITE_URL ||
  procEnv?.VITE_SITE_URL ||
  procEnv?.NEXT_PUBLIC_SITE_URL ||
  procEnv?.APP_URL ||
  '';

let activeSiteUrl = staticSiteUrl;

/**
 * Returns the canonical or active site URL used for dynamic QR redirect URLs.
 * Priority:
 * 1. Explicitly configured VITE_SITE_URL or NEXT_PUBLIC_SITE_URL
 * 2. In-browser dynamic origin (window.location.origin)
 * 3. Default fallback https://qrcreative.app
 */
export function getSiteUrl(): string {
  if (activeSiteUrl && activeSiteUrl.trim() !== '') {
    return activeSiteUrl.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return 'https://qrcreative.app';
}

export function setActiveSiteUrl(url: string): void {
  if (url) {
    activeSiteUrl = url.replace(/\/$/, '');
  }
}

/**
 * Optionally loads runtime config from the Express backend /api/config
 */
export async function fetchRuntimeConfig(): Promise<RuntimeConfig | null> {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) return null;
    const data: RuntimeConfig = await res.json();
    if (data?.siteUrl) {
      setActiveSiteUrl(data.siteUrl);
    }
    return data;
  } catch {
    return null;
  }
}
