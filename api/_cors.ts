const ALLOWED_STATIC_ORIGINS = new Set<string>([
  'https://smart-solve-40fb3.web.app',
  'https://smart-solve-40fb3.firebaseapp.com',
]);

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (ALLOWED_STATIC_ORIGINS.has(origin)) return true;

  const extra = (process.env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (extra.includes(origin)) return true;

  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (parsed.protocol === 'https:') {
      if (host.endsWith('.vercel.app')) return true;
      if (host.endsWith('.run.app')) return true;
      if (host.endsWith('.web.app') || host.endsWith('.firebaseapp.com')) {
        return host.startsWith('smart-solve-40fb3');
      }
    }
  } catch {
    return false;
  }

  return false;
}

export function applyCorsHeaders(req: any, res: any): boolean {
  const origin = typeof req?.headers?.origin === 'string' ? req.headers.origin : '';

  res.setHeader('Vary', 'Origin');
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', 'https://smart-solve-40fb3.web.app');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-gemini-key');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req?.method === 'OPTIONS') {
    if (typeof res.sendStatus === 'function') {
      res.sendStatus(200);
    } else {
      res.statusCode = 200;
      res.end();
    }
    return true;
  }

  return false;
}
