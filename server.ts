import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Optional Supabase client on server
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

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
  res.json({ status: 'ok', service: 'qrcreative' });
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
