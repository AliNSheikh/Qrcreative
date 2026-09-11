/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from '../../types';

function sanitizeSupabaseUrl(url: string = ''): string {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

// Default Supabase project credentials for qrcreative
const DEFAULT_SUPABASE_URL = 'https://jktkyniasjiuvpmjzuix.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprdGt5bmlhc2ppdXZwbWp6dWl4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjU1NzcsImV4cCI6MjEwNDY0MTU3N30.FmHWBGeR9elTmIcy1NQxENlRlZdxRj6o_ZkamILSlEE';

// Detect environment variables for Supabase
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
const procEnv = typeof process !== 'undefined' ? process.env : undefined;

const rawSupabaseUrl =
  metaEnv?.VITE_SUPABASE_URL ||
  procEnv?.NEXT_PUBLIC_SUPABASE_URL ||
  procEnv?.VITE_SUPABASE_URL ||
  DEFAULT_SUPABASE_URL;

const supabaseUrl = sanitizeSupabaseUrl(rawSupabaseUrl);

const supabaseAnonKey =
  metaEnv?.VITE_SUPABASE_ANON_KEY ||
  procEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  procEnv?.VITE_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_ANON_KEY;

export let isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  supabaseAnonKey.length > 20
);

export let supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Initializes Supabase from backend /api/config if not pre-configured via Vite env vars
 */
export async function ensureSupabaseInitialized(): Promise<boolean> {
  if (isSupabaseConfigured && supabase) return true;
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/config');
    if (!res.ok) return false;
    const data = await res.json();
    const cleanUrl = sanitizeSupabaseUrl(data?.supabase?.url);
    if (
      cleanUrl &&
      data?.supabase?.anonKey &&
      cleanUrl.startsWith('https://') &&
      data.supabase.anonKey.length > 20
    ) {
      supabase = createClient(cleanUrl, data.supabase.anonKey);
      isSupabaseConfigured = true;
      return true;
    }
  } catch {
    // Ignore runtime network error
  }
  return false;
}

// Local fallback session storage key
const LOCAL_USER_KEY = 'qrcreative_auth_user';
const LOCAL_USERS_DB_KEY = 'qrcreative_users_db';

export async function getCurrentUser(): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) {
    await ensureSupabaseInitialized();
  }

  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Query profiles table
      let { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // Ensure row exists in public.profiles table
      if (!profile && user.id) {
        try {
          const fallbackName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';
          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email || '',
            display_name: fallbackName,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        } catch {
          // Ignored if handled by trigger or permission
        }
      }

      return {
        id: user.id,
        email: user.email || '',
        display_name: profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
        avatar_url: profile?.avatar_url,
        created_at: user.created_at
      };
    } catch {
      return null;
    }
  }

  // Fallback to local session
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
  }
  return null;
}

export async function signInWithEmail(email: string, password: string): Promise<{ user: UserProfile | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    await ensureSupabaseInitialized();
  }

  if (isSupabaseConfigured && supabase) {
    let { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });

    // If error is "Email not confirmed", auto-confirm via server and retry immediately
    if (error && error.message.toLowerCase().includes('not confirmed')) {
      try {
        const confirmRes = await fetch('/api/auth/confirm-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase() })
        });
        if (confirmRes.ok) {
          const retry = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
          if (!retry.error && retry.data.user) {
            data = retry.data;
            error = null;
          }
        }
      } catch {
        // Continue with original error
      }
    }

    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials')) {
        return {
          user: null,
          error: 'Invalid email or password. Please check your credentials or create a new account.'
        };
      }
      return { user: null, error: error.message };
    }
    if (!data.user) return { user: null, error: 'User not found' };

    let { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    // Auto-create profile row if it doesn't exist yet
    if (!profile) {
      try {
        const fallbackName = data.user.user_metadata?.display_name || email.split('@')[0];
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email: data.user.email || email,
          display_name: fallbackName,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (upsertErr) {
        console.warn('Auto profile creation notice:', upsertErr);
      }
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || email,
        display_name: profile?.display_name || data.user.user_metadata?.display_name || email.split('@')[0],
        avatar_url: profile?.avatar_url,
        created_at: data.user.created_at
      },
      error: null
    };
  }

  return { user: null, error: 'Connecting to database... Please reload the page and try again.' };
}

export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<{ user: UserProfile | null; error: string | null }> {
  const cleanEmail = email.trim().toLowerCase();
  const name = displayName.trim() || cleanEmail.split('@')[0];

  // 1. Primary: Server registration endpoint with instant email confirmation (if server is running)
  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, password, displayName: name })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        // Log in on this client browser to establish the active Supabase JWT session
        if (!isSupabaseConfigured) {
          await ensureSupabaseInitialized();
        }
        if (supabase) {
          const { data: signData, error: signErr } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password
          });
          if (!signErr && signData.user) {
            return {
              user: {
                id: signData.user.id,
                email: signData.user.email || cleanEmail,
                display_name: name,
                created_at: signData.user.created_at
              },
              error: null
            };
          }
        }
        return { user: data.user, error: null };
      }
    } else if (res.status === 409) {
      const data = await res.json().catch(() => ({}));
      return { user: null, error: data.error || 'An account with this email address already exists. Please sign in instead.' };
    }
    // If status is 404, 502, etc. (e.g. static host on Vercel), fall through to Supabase client SDK below
  } catch (err: any) {
    console.warn('Server registration notice, falling back to direct Supabase SDK:', err);
  }

  // 2. Client fallback via supabase.auth.signUp
  if (!isSupabaseConfigured) {
    await ensureSupabaseInitialized();
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { display_name: name }
      }
    });
    if (error) return { user: null, error: error.message };
    if (!data.user) return { user: null, error: 'Registration failed' };

    // If Supabase required email confirmation and issued no session
    if (!data.session && (!data.user.identities || data.user.identities.length === 0)) {
      return { user: null, error: 'An account with this email address already exists. Please sign in instead.' };
    }

    // Auto-confirm via server if unconfirmed
    if (!data.session) {
      try {
        await fetch('/api/auth/confirm-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: cleanEmail })
        });
        const retrySign = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (!retrySign.error && retrySign.data.user) {
          return {
            user: {
              id: retrySign.data.user.id,
              email: retrySign.data.user.email || cleanEmail,
              display_name: name,
              created_at: retrySign.data.user.created_at
            },
            error: null
          };
        }
      } catch {
        // Continue
      }
    }

    const userProfile: UserProfile = {
      id: data.user.id,
      email: data.user.email || cleanEmail,
      display_name: name,
      created_at: data.user.created_at
    };
    return { user: userProfile, error: null };
  }

  return { user: null, error: 'Could not connect to database. Please check your internet connection.' };
}

export async function signOutUser(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
  }
  if (typeof window !== 'undefined') {
    localStorage.removeItem(LOCAL_USER_KEY);
  }
}

export async function updateProfile(displayName: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    await supabase.from('profiles').upsert({
      id: user.id,
      display_name: displayName,
      updated_at: new Date().toISOString()
    });
    return true;
  }

  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (raw) {
      const user = JSON.parse(raw);
      user.display_name = displayName;
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));

      // Update in users db
      const rawDb = localStorage.getItem(LOCAL_USERS_DB_KEY);
      if (rawDb) {
        const users = JSON.parse(rawDb);
        const idx = users.findIndex((u: any) => u.id === user.id);
        if (idx >= 0) {
          users[idx].display_name = displayName;
          localStorage.setItem(LOCAL_USERS_DB_KEY, JSON.stringify(users));
        }
      }
      return true;
    }
  }
  return false;
}
