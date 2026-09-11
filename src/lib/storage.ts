import { QRCodeRecord, QRScanRecord } from '../types';
import { isSupabaseConfigured, supabase, ensureSupabaseInitialized } from './supabase/client';
import { detectClientLocation, getCountryName } from './geo';

const LOCAL_QR_KEY = 'qrcreative_qr_codes';
const LOCAL_SCANS_KEY = 'qrcreative_scans';

// Validate destination URL protocol
export function validateDestinationUrl(url: string): { valid: boolean; error?: string; cleanUrl?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Destination URL is required' };
  }

  const trimmed = url.trim();

  // Reject dangerous schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('about:')
  ) {
    return { valid: false, error: 'Unsafe URL protocol. Only http:// and https:// links are permitted.' };
  }

  // Ensure http/https
  let cleanUrl = trimmed;
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = 'https://' + cleanUrl;
  }

  try {
    const parsed = new URL(cleanUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Invalid URL protocol. Only HTTP and HTTPS are permitted.' };
    }
    return { valid: true, cleanUrl };
  } catch {
    return { valid: false, error: 'Invalid URL format.' };
  }
}

// Generate a random 6-character alphanumeric slug (e.g. "X7PA91")
export function generateUniqueSlug(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz';
  let slug = '';
  for (let i = 0; i < 6; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

// Load all QR codes from local storage
function getLocalQRCodes(): QRCodeRecord[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(LOCAL_QR_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// Save all QR codes to local storage
function saveLocalQRCodes(codes: QRCodeRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_QR_KEY, JSON.stringify(codes));
}

// Save or update a QR code
export async function saveQRCode(
  record: Omit<QRCodeRecord, 'id' | 'created_at' | 'updated_at' | 'scans_count'> & {
    id?: string;
  }
): Promise<QRCodeRecord> {
  const now = new Date().toISOString();

  // Handle editable slug
  let slug = record.slug;
  let destination_url = record.destination_url;

  if (record.mode === 'editable') {
    if (!slug) {
      slug = generateUniqueSlug();
    }
    if (record.content?.url) {
      const val = validateDestinationUrl(record.content.url);
      destination_url = val.cleanUrl || record.content.url;
    }
  }

  // If Supabase is available
  if (!isSupabaseConfigured) {
    await ensureSupabaseInitialized();
  }

  if (isSupabaseConfigured && supabase) {
    if (record.id) {
      // Update
      const contentToSave = {
        ...(record.content || {}),
        landingPage: record.landing_page || record.content?.landingPage
      };

      const { data, error } = await supabase
        .from('qr_codes')
        .update({
          name: record.name,
          type: record.type,
          mode: record.mode,
          content: contentToSave,
          slug,
          destination_url,
          design: record.design,
          is_active: record.is_active,
          updated_at: now
        })
        .eq('id', record.id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      const resData = data as QRCodeRecord;
      resData.landing_page = resData.content?.landingPage || record.landing_page;
      return resData;
    } else {
      // Insert
      const contentToSave = {
        ...(record.content || {}),
        landingPage: record.landing_page || record.content?.landingPage
      };

      const { data, error } = await supabase
        .from('qr_codes')
        .insert({
          user_id: record.user_id,
          name: record.name,
          type: record.type,
          mode: record.mode,
          content: contentToSave,
          slug,
          destination_url,
          design: record.design,
          is_active: record.is_active ?? true,
          scans_count: 0,
          created_at: now,
          updated_at: now
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      const resData = data as QRCodeRecord;
      resData.landing_page = resData.content?.landingPage || record.landing_page;
      return resData;
    }
  }

  // Local fallback storage
  const codes = getLocalQRCodes();
  if (record.id) {
    const idx = codes.findIndex(c => c.id === record.id);
    if (idx >= 0) {
      const updated: QRCodeRecord = {
        ...codes[idx],
        ...record,
        slug: codes[idx].slug || slug, // Preserve slug!
        destination_url,
        updated_at: now
      };
      codes[idx] = updated;
      saveLocalQRCodes(codes);
      // Also notify server if running
      notifyServerOfQR(updated);
      return updated;
    }
  }

  // New QR code
  const newCode: QRCodeRecord = {
    ...record,
    id: 'qr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
    slug,
    destination_url,
    scans_count: 0,
    created_at: now,
    updated_at: now
  };
  codes.unshift(newCode);
  saveLocalQRCodes(codes);
  notifyServerOfQR(newCode);
  return newCode;
}

// Helper to keep server in-memory redirect lookup synced
async function notifyServerOfQR(code: QRCodeRecord) {
  if (code.mode === 'editable' && code.slug && code.destination_url) {
    try {
      await fetch('/api/qr/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: code.id,
          slug: code.slug,
          destination_url: code.destination_url,
          is_active: code.is_active,
          name: code.name
        })
      });
    } catch {
      // Non-blocking
    }
  }
}

// Fetch all QR codes for a user
export async function getUserQRCodes(userId: string): Promise<QRCodeRecord[]> {
  if (!isSupabaseConfigured) {
    await ensureSupabaseInitialized();
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as QRCodeRecord[];
  }

  const all = getLocalQRCodes();
  return all.filter(c => c.user_id === userId);
}

// Fetch a single QR code by ID
export async function getQRCodeById(id: string): Promise<QRCodeRecord | null> {
  if (!isSupabaseConfigured) {
    await ensureSupabaseInitialized();
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    const record = data as QRCodeRecord;
    record.landing_page = record.content?.landingPage || record.landing_page;
    return record;
  }

  const all = getLocalQRCodes();
  const record = all.find(c => c.id === id) || null;
  if (record) {
    record.landing_page = record.content?.landingPage || record.landing_page;
  }
  return record;
}

// Fetch a single QR code by its unique slug (e.g. for landing page view)
export async function getQRCodeBySlug(slug: string): Promise<QRCodeRecord | null> {
  if (!slug) return null;
  const cleanSlug = slug.trim().toLowerCase();

  // 1. Try server API route if available
  try {
    const res = await fetch(`/api/qr/slug/${encodeURIComponent(cleanSlug)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.id) {
        data.landing_page = data.content?.landingPage || data.landing_page;
        return data as QRCodeRecord;
      }
    }
  } catch {
    // Non-blocking, fallback to direct supabase / local
  }

  // 2. Direct Supabase query
  if (!isSupabaseConfigured) {
    await ensureSupabaseInitialized();
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('qr_codes')
      .select('*')
      .ilike('slug', cleanSlug)
      .maybeSingle();

    if (!error && data) {
      const record = data as QRCodeRecord;
      record.landing_page = record.content?.landingPage || record.landing_page;
      return record;
    }
  }

  // 3. Fallback to local storage
  const all = getLocalQRCodes();
  const localRecord = all.find(c => (c.slug || '').trim().toLowerCase() === cleanSlug) || null;
  if (localRecord) {
    localRecord.landing_page = localRecord.content?.landingPage || localRecord.landing_page;
  }
  return localRecord;
}

// Duplicate a QR code
export async function duplicateQRCode(id: string, userId: string): Promise<QRCodeRecord> {
  const existing = await getQRCodeById(id);
  if (!existing) {
    throw new Error('QR code not found');
  }

  const newName = `${existing.name} (Copy)`;
  // If editable, generate a brand new unique slug!
  const newSlug = existing.mode === 'editable' ? generateUniqueSlug() : undefined;

  return await saveQRCode({
    user_id: userId,
    name: newName,
    type: existing.type,
    mode: existing.mode,
    content: JSON.parse(JSON.stringify(existing.content)),
    slug: newSlug,
    destination_url: existing.destination_url,
    design: JSON.parse(JSON.stringify(existing.design)),
    is_active: true
  });
}

// Delete a QR code
export async function deleteQRCode(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    await ensureSupabaseInitialized();
  }

  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('qr_codes')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
  }

  const codes = getLocalQRCodes();
  const filtered = codes.filter(c => c.id !== id);
  saveLocalQRCodes(filtered);

  // Notify server deletion
  try {
    await fetch(`/api/qr/${id}`, { method: 'DELETE' });
  } catch {
    // Non-blocking
  }
  return true;
}

export interface ScanMetadata {
  referrer?: string;
  user_agent?: string;
  device_type?: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  country?: string;
  country_code?: string;
  city?: string;
}

// Record a scan event with automatic or supplied country location
export async function recordScanEvent(
  qrCodeId: string,
  metadata?: ScanMetadata
): Promise<QRScanRecord> {
  const now = new Date().toISOString();

  // Resolve location if not provided
  let country = metadata?.country;
  let country_code = metadata?.country_code;
  let city = metadata?.city;

  if (!country || !country_code) {
    try {
      const geo = await detectClientLocation();
      country = country || geo.country;
      country_code = country_code || geo.country_code;
      city = city || geo.city;
    } catch {
      country = country || 'United States';
      country_code = country_code || 'US';
    }
  }

  const device_type = metadata?.device_type || (typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop');
  const user_agent = metadata?.user_agent || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
  const referrer = metadata?.referrer || (typeof document !== 'undefined' ? document.referrer : '');

  const scanRecord: QRScanRecord = {
    id: 'scn_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    qr_code_id: qrCodeId,
    scanned_at: now,
    referrer,
    user_agent,
    device_type,
    country: country || getCountryName(country_code) || 'United States',
    country_code: (country_code || 'US').toUpperCase(),
    city
  };

  // 1. Post to server endpoint to sync in-memory store
  try {
    fetch(`/api/qr/${encodeURIComponent(qrCodeId)}/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        country: scanRecord.country,
        country_code: scanRecord.country_code,
        city: scanRecord.city,
        referrer,
        user_agent,
        device_type
      })
    }).catch(() => {});
  } catch {
    // Non-blocking
  }

  // 2. If Supabase is configured, insert to Supabase
  if (!isSupabaseConfigured) {
    await ensureSupabaseInitialized();
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('qr_scans').insert({
        qr_code_id: qrCodeId,
        referrer,
        user_agent,
        device_type,
        country: scanRecord.country,
        country_code: scanRecord.country_code,
        city: scanRecord.city,
        scanned_at: now
      });
      await supabase.rpc('increment_qr_scans', { qrid: qrCodeId });
    } catch (e) {
      console.warn('Supabase scan insert notice:', e);
    }
  }

  // 3. Update local storage
  const codes = getLocalQRCodes();
  const idx = codes.findIndex(c => c.id === qrCodeId);
  if (idx >= 0) {
    codes[idx].scans_count = (codes[idx].scans_count || 0) + 1;
    saveLocalQRCodes(codes);
  }

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_SCANS_KEY);
    const scans: QRScanRecord[] = raw ? JSON.parse(raw) : [];
    scans.unshift(scanRecord);
    localStorage.setItem(LOCAL_SCANS_KEY, JSON.stringify(scans.slice(0, 500)));
  }

  return scanRecord;
}

// Retrieve all recorded scans for a given QR code
export async function getScanRecords(qrCodeId: string): Promise<QRScanRecord[]> {
  const combinedMap = new Map<string, QRScanRecord>();

  // 1. Check local storage
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_SCANS_KEY);
    if (raw) {
      try {
        const localScans: QRScanRecord[] = JSON.parse(raw);
        for (const s of localScans) {
          if (s.qr_code_id === qrCodeId) {
            combinedMap.set(s.id, s);
          }
        }
      } catch {
        // Ignored
      }
    }
  }

  // 2. Fetch from backend server API
  try {
    const res = await fetch(`/api/qr/${encodeURIComponent(qrCodeId)}/scans`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.scans)) {
        for (const s of data.scans) {
          if (s.qr_code_id === qrCodeId || !s.qr_code_id) {
            combinedMap.set(s.id, { ...s, qr_code_id: qrCodeId });
          }
        }
      }
    }
  } catch {
    // Non-blocking
  }

  // 3. Fetch from Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('qr_scans')
        .select('*')
        .eq('qr_code_id', qrCodeId)
        .order('scanned_at', { ascending: false })
        .limit(250);

      if (!error && data) {
        for (const s of data) {
          combinedMap.set(s.id, s as QRScanRecord);
        }
      }
    } catch {
      // Ignored
    }
  }

  const allScans = Array.from(combinedMap.values());
  allScans.sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime());
  return allScans;
}

// Clear all recorded scans for a specific QR code
export async function clearScansForQR(qrCodeId: string): Promise<void> {
  const codes = getLocalQRCodes();
  const idx = codes.findIndex(c => c.id === qrCodeId);
  if (idx >= 0) {
    codes[idx].scans_count = 0;
    saveLocalQRCodes(codes);
  }

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_SCANS_KEY);
    if (raw) {
      try {
        const localScans: QRScanRecord[] = JSON.parse(raw);
        const filtered = localScans.filter(s => s.qr_code_id !== qrCodeId);
        localStorage.setItem(LOCAL_SCANS_KEY, JSON.stringify(filtered));
      } catch {
        // Ignored
      }
    }
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('qr_scans').delete().eq('qr_code_id', qrCodeId);
      await supabase.from('qr_codes').update({ scans_count: 0 }).eq('id', qrCodeId);
    } catch {
      // Ignored
    }
  }
}
