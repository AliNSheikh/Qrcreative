import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function sanitizeSupabaseUrl(url: string = ''): string {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

function sanitizeSiteUrl(url: string = ''): string {
  if (!url) return '';
  return url.trim().replace(/\/+$/, '');
}

// Optional Supabase client on server
const rawSupabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';

const supabaseUrl = sanitizeSupabaseUrl(rawSupabaseUrl);

const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_KEY ||
  '';

const supabaseServer = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// In-memory cache for fast redirect lookups (populated dynamically or synced from app)
interface RedirectItem {
  id?: string;
  slug: string;
  destination_url: string;
  is_active: boolean;
  name?: string;
}

const redirectStore = new Map<string, RedirectItem>();

// Helper to determine device category from user-agent
function parseDeviceType(ua: string = ''): 'mobile' | 'tablet' | 'desktop' {
  const lower = ua.toLowerCase();
  if (/ipad|tablet|(android(?!.*mobile))/i.test(lower)) {
    return 'tablet';
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(lower)) {
    return 'mobile';
  }
  return 'desktop';
}

// Helper to validate destination protocol
function isSafeProtocol(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('file:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('about:')
  ) {
    return false;
  }
  return /^https?:\/\//i.test(trimmed);
}

// 1. Core Fast Server-Side Redirect Route /r/:slug
app.get('/r/:slug', async (req, res) => {
  const slug = req.params.slug;
  if (!slug) {
    return res.status(404).send('Invalid redirect link');
  }

  let target = redirectStore.get(slug);

  // If not in memory and Supabase is configured, check Supabase
  if (!target && supabaseServer) {
    try {
      const { data, error } = await supabaseServer
        .from('qr_codes')
        .select('id, slug, destination_url, is_active, name')
        .eq('slug', slug)
        .single();

      if (!error && data) {
        target = data as RedirectItem;
        redirectStore.set(slug, target);
      }
    } catch (err) {
      console.error('Error fetching redirect from Supabase:', err);
    }
  }

  if (!target) {
    // Elegant qrcreative 404 response
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>QR Code Not Found — qrcreative</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; color: #111827; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
          .card { background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 40px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
          .badge { display: inline-block; background: #fee2e2; color: #ef4444; font-weight: 600; font-size: 13px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; }
          h1 { margin: 0 0 12px; font-size: 24px; font-weight: 700; color: #0f172a; }
          p { margin: 0 0 24px; color: #64748b; font-size: 15px; line-height: 1.6; }
          a { display: inline-block; background: #6d5dfc; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 12px; transition: background 0.2s; }
          a:hover { background: #5a49ef; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">Link Not Found</div>
          <h1>QR Destination Unavailable</h1>
          <p>The editable QR code you scanned (${escapeHtml(slug)}) has not been assigned or may have been deleted by its owner.</p>
          <a href="/">Create Your Own Free QR Code</a>
        </div>
      </body>
      </html>
    `);
  }

  if (!target.is_active) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>QR Code Deactivated — qrcreative</title>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fafc; color: #111827; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; box-sizing: border-box; }
          .card { background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; padding: 40px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
          .badge { display: inline-block; background: #fef3c7; color: #d97706; font-weight: 600; font-size: 13px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; }
          h1 { margin: 0 0 12px; font-size: 24px; font-weight: 700; color: #0f172a; }
          p { margin: 0 0 24px; color: #64748b; font-size: 15px; line-height: 1.6; }
          a { display: inline-block; background: #6d5dfc; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 24px; border-radius: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">Paused</div>
          <h1>QR Code Currently Inactive</h1>
          <p>This dynamic QR code is temporarily paused by its creator.</p>
          <a href="/">Go to qrcreative</a>
        </div>
      </body>
      </html>
    `);
  }

  // Validate destination protocol
  let dest = target.destination_url;
  if (!/^https?:\/\//i.test(dest)) {
    dest = 'https://' + dest;
  }

  if (!isSafeProtocol(dest)) {
    return res.status(400).send('Unsafe destination URL protocol detected.');
  }

  // Record scan analytics asynchronously
  const userAgent = req.headers['user-agent'] || '';
  const referrer = (req.headers['referer'] as string) || '';
  const deviceType = parseDeviceType(userAgent);

  if (target.id && supabaseServer) {
    (async () => {
      try {
        await supabaseServer.from('qr_scans').insert({
          qr_code_id: target.id,
          user_agent: userAgent.substring(0, 500),
          referrer: referrer.substring(0, 500),
          device_type: deviceType,
          scanned_at: new Date().toISOString()
        });
        await supabaseServer.rpc('increment_qr_scans', { qrid: target.id });
      } catch (err) {
        console.error('Scan log error:', err);
      }
    })();
  }

  // Fast 302 redirect
  return res.redirect(302, dest);
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'qrcreative',
    supabaseConnected: Boolean(supabaseServer)
  });
});

// Runtime configuration endpoint for site URL and public Supabase config
app.get('/api/config', (req, res) => {
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || `localhost:${PORT}`;
  const proto = (req.headers['x-forwarded-proto'] as string) || (req.secure ? 'https' : 'http');
  const detectedOrigin = `${proto}://${host}`;

  const configuredSiteUrl =
    process.env.VITE_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    process.env.SITE_URL ||
    detectedOrigin;

  const publicSupabaseUrl =
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';

  const publicSupabaseAnonKey =
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY ||
    '';

  const cleanSiteUrl = sanitizeSiteUrl(configuredSiteUrl);
  const cleanSupabaseUrl = sanitizeSupabaseUrl(publicSupabaseUrl);

  res.json({
    siteUrl: cleanSiteUrl,
    detectedOrigin,
    supabase: {
      url: cleanSupabaseUrl,
      anonKey: publicSupabaseAnonKey,
      isConfigured: Boolean(
        cleanSupabaseUrl &&
        publicSupabaseAnonKey &&
        cleanSupabaseUrl.startsWith('https://') &&
        publicSupabaseAnonKey.length > 20
      )
    }
  });
});

// Direct server-side registration with instant email confirmation
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (!supabaseServer) {
      return res.status(503).json({ error: 'Database service is currently unavailable.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const name = (displayName && typeof displayName === 'string' && displayName.trim())
      ? displayName.trim()
      : cleanEmail.split('@')[0];

    // Check if user already exists in auth.users
    const { data: userList } = await supabaseServer.auth.admin.listUsers();
    if (userList?.users?.some(u => u.email?.toLowerCase() === cleanEmail)) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
    }

    // Create user via Admin API with email_confirm: true so they can log in instantly from any browser
    const { data, error } = await supabaseServer.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { display_name: name }
    });

    if (error) {
      if (error.message.toLowerCase().includes('already registered') || error.status === 422) {
        return res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
      }
      return res.status(400).json({ error: error.message });
    }

    if (!data.user) {
      return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }

    // Ensure profile row in public.profiles table
    try {
      await supabaseServer.from('profiles').upsert({
        id: data.user.id,
        email: cleanEmail,
        display_name: name,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    } catch (profileErr) {
      console.warn('Profile upsert notice in /api/auth/register:', profileErr);
    }

    return res.status(200).json({
      success: true,
      user: {
        id: data.user.id,
        email: cleanEmail,
        display_name: name,
        created_at: data.user.created_at
      }
    });
  } catch (err: any) {
    console.error('Error in /api/auth/register:', err);
    return res.status(500).json({ error: err.message || 'Registration failed.' });
  }
});

// Auto-confirm user if unconfirmed
app.post('/api/auth/confirm-user', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required.' });
    }
    if (!supabaseServer) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabaseServer.auth.admin.listUsers();
    if (error) return res.status(500).json({ error: error.message });

    const targetUser = data.users.find(u => u.email?.toLowerCase() === cleanEmail);
    if (!targetUser) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    // Confirm email
    const updateRes = await supabaseServer.auth.admin.updateUserById(targetUser.id, {
      email_confirm: true
    });
    if (updateRes.error) {
      return res.status(500).json({ error: updateRes.error.message });
    }

    // Ensure profile row
    try {
      await supabaseServer.from('profiles').upsert({
        id: targetUser.id,
        email: cleanEmail,
        display_name: targetUser.user_metadata?.display_name || cleanEmail.split('@')[0],
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    } catch {
      // Ignored
    }

    return res.json({ success: true, message: 'Account confirmed successfully. You can now sign in.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Confirmation failed.' });
  }
});

// Check if user exists in database
app.post('/api/auth/check-user', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !supabaseServer) return res.json({ exists: false });
    const cleanEmail = email.trim().toLowerCase();
    const { data } = await supabaseServer.auth.admin.listUsers();
    const exists = Boolean(data?.users?.some(u => u.email?.toLowerCase() === cleanEmail));
    return res.json({ exists });
  } catch {
    return res.json({ exists: false });
  }
});

// Password reset request endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { email, redirectTo } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required.' });
    }
    if (!supabaseServer) {
      return res.status(503).json({ error: 'Database service is unavailable.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const redirect = redirectTo || 'https://qrcreative.vercel.app';

    // Verify user exists in Supabase auth.users
    const { data: userList } = await supabaseServer.auth.admin.listUsers();
    const userFound = userList?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
    if (!userFound) {
      return res.status(404).json({ error: 'No account found with this email address. Please check spelling or create a new free account.' });
    }

    // Generate verified recovery link using Admin API (bypasses standard mailer failure)
    const linkRes = await supabaseServer.auth.admin.generateLink({
      type: 'recovery',
      email: cleanEmail,
      options: { redirectTo: redirect }
    });

    let actionLink = linkRes.data?.properties?.action_link;

    // Also attempt to trigger Supabase built-in email dispatch
    let emailSent = false;
    let emailNotice = '';
    try {
      const emailRes = await supabaseServer.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirect
      });
      if (!emailRes.error) {
        emailSent = true;
      } else {
        emailNotice = emailRes.error.message;
      }
    } catch (e: any) {
      emailNotice = e.message;
    }

    return res.json({
      success: true,
      emailSent,
      emailNotice: emailNotice || undefined,
      recoveryLink: actionLink,
      message: emailSent
        ? `Password reset link has been sent to ${cleanEmail}. Please check your inbox and spam folder.`
        : `Password recovery link generated for ${cleanEmail}.`
    });
  } catch (err: any) {
    console.error('Error in /api/auth/reset-password:', err);
    return res.status(500).json({ error: err.message || 'Password reset request failed.' });
  }
});

// Sync a redirect slug into server memory
app.post('/api/qr/sync', (req, res) => {
  const { id, slug, destination_url, is_active, name } = req.body;
  if (!slug || !destination_url) {
    return res.status(400).json({ error: 'Missing slug or destination_url' });
  }

  redirectStore.set(slug, {
    id,
    slug,
    destination_url,
    is_active: is_active ?? true,
    name
  });

  res.json({ success: true, slug });
});

// Delete from memory
app.delete('/api/qr/:id', (req, res) => {
  const id = req.params.id;
  for (const [slug, item] of redirectStore.entries()) {
    if (item.id === id) {
      redirectStore.delete(slug);
    }
  }
  res.json({ success: true });
});

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (m) => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#039;';
      default: return m;
    }
  });
}

// Start Server with Vite middleware in dev or static serve in prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`qrcreative server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
