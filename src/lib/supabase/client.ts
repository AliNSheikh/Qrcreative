/// <reference types="vite/client" />
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile } from '../../types';

function sanitizeSupabaseUrl(url: string = ''): string {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

// Detect environment variables for Supabase
const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : undefined;
const procEnv = typeof process !== 'undefined' ? process.env : undefined;

const rawSupabaseUrl =
  metaEnv?.VITE_SUPABASE_URL ||
  procEnv?.NEXT_PUBLIC_SUPABASE_URL ||
  procEnv?.VITE_SUPABASE_URL ||
  '';

const supabaseUrl = sanitizeSupabaseUrl(rawSupabaseUrl);

const supabaseAnonKey =
  metaEnv?.VITE_SUPABASE_ANON_KEY ||
  procEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  procEnv?.VITE_SUPABASE_ANON_KEY ||
  '';

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
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

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
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { user: null, error: error.message };
    if (!data.user) return { user: null, error: 'User not found' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

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

  // Local fallback auth
  if (typeof window !== 'undefined') {
    const rawDb = localStorage.getItem(LOCAL_USERS_DB_KEY);
    const users: Array<{ id: string; email: string; password: string; display_name: string; created_at: string }> = rawDb ? JSON.parse(rawDb) : [];
    const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!matched) {
      // For immediate ease in the preview demo: if user has no account yet, let's allow them to register, or if they type password, handle smoothly
      return { user: null, error: 'Invalid email or password. Please check your credentials or create a new free account.' };
    }
    if (matched.password !== password) {
      return { user: null, error: 'Incorrect password.' };
    }

    const userProfile: UserProfile = {
      id: matched.id,
      email: matched.email,
      display_name: matched.display_name,
      created_at: matched.created_at
    };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userProfile));
    return { user: userProfile, error: null };
  }

  return { user: null, error: 'Authentication service unavailable' };
}

export async function signUpWithEmail(email: string, password: string, displayName: string): Promise<{ user: UserProfile | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    await ensureSupabaseInitialized();
  }

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName }
      }
    });
    if (error) return { user: null, error: error.message };
    if (!data.user) return { user: null, error: 'Registration failed' };

    // Insert profile
    await supabase.from('profiles').upsert({
      id: data.user.id,
      display_name: displayName,
      updated_at: new Date().toISOString()
    });

    const userProfile: UserProfile = {
      id: data.user.id,
      email: data.user.email || email,
      display_name: displayName,
      created_at: data.user.created_at
    };
    return { user: userProfile, error: null };
  }

  // Local fallback registration
  if (typeof window !== 'undefined') {
    const rawDb = localStorage.getItem(LOCAL_USERS_DB_KEY);
    const users: Array<{ id: string; email: string; password: string; display_name: string; created_at: string }> = rawDb ? JSON.parse(rawDb) : [];

    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { user: null, error: 'An account with this email already exists. Please sign in instead.' };
    }

    const newUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
      email: email.toLowerCase(),
      password,
      display_name: displayName || email.split('@')[0],
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(LOCAL_USERS_DB_KEY, JSON.stringify(users));

    const userProfile: UserProfile = {
      id: newUser.id,
      email: newUser.email,
      display_name: newUser.display_name,
      created_at: newUser.created_at
    };
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(userProfile));
    return { user: userProfile, error: null };
  }

  return { user: null, error: 'Registration service unavailable' };
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
