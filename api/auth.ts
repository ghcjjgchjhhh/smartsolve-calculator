import crypto from 'crypto';
import { Auth, type AuthConfig } from '@auth/core';
import Google from '@auth/core/providers/google';
import { decode } from '@auth/core/jwt';

export interface AuthSessionUser {
  id: string;
  uid: string;
  email: string | null;
  name: string | null;
  displayName: string | null;
  image: string | null;
  photoURL: string | null;
}

// Ephemeral fallback secret ONLY used for non-production local smoke runs when AUTH_SECRET is unset
const EPHEMERAL_DEV_SECRET = crypto
  .createHash('sha256')
  .update(`smartsolve-local-dev-${process.cwd()}`)
  .digest('hex');

export function getAuthSecret(): string {
  const configured =
    (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '').trim();
  if (configured) return configured;

  const isProd =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production';
  if (!isProd) {
    return EPHEMERAL_DEV_SECRET;
  }
  return '';
}

export function getGoogleOAuthCredentials(): {
  clientId: string;
  clientSecret: string;
  configured: boolean;
} {
  const clientId = (
    process.env.GOOGLE_CLIENT_ID ||
    process.env.AUTH_GOOGLE_ID ||
    ''
  ).trim();
  const clientSecret = (
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.AUTH_GOOGLE_SECRET ||
    ''
  ).trim();
  return {
    clientId,
    clientSecret,
    configured: Boolean(clientId && clientSecret),
  };
}

function firstHeaderValue(val: string | string[] | undefined): string {
  if (!val) return '';
  const raw = Array.isArray(val) ? val[0] : val;
  return raw.split(',')[0].trim();
}

export function getRequestOriginAndProtocol(req: any): {
  origin: string;
  host: string;
  isHttps: boolean;
} {
  const host =
    firstHeaderValue(req?.headers?.['x-forwarded-host']) ||
    firstHeaderValue(req?.headers?.host) ||
    'localhost:3000';
  const forwardedProto = firstHeaderValue(req?.headers?.['x-forwarded-proto']);
  const isLocalHost =
    host.startsWith('localhost') ||
    host.startsWith('127.0.0.1') ||
    host.startsWith('0.0.0.0');

  let proto = forwardedProto;
  if (!proto) {
    if (req?.protocol === 'https' || req?.socket?.encrypted) proto = 'https';
    else if (!isLocalHost && process.env.VERCEL) proto = 'https';
    else if (!isLocalHost && (process.env.APP_URL || '').startsWith('https://')) proto = 'https';
    else proto = 'http';
  }

  const isHttps = proto === 'https';
  return {
    origin: `${proto}://${host}`,
    host,
    isHttps,
  };
}

function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

export async function getSessionUserFromReq(req: any): Promise<AuthSessionUser | null> {
  const secret = getAuthSecret();
  if (!secret) return null;

  const cookieHeader =
    typeof req?.headers?.cookie === 'string'
      ? req.headers.cookie
      : typeof req?.headers?.get === 'function'
      ? req.headers.get('cookie') || ''
      : '';

  const cookies = parseCookieHeader(cookieHeader);
  const candidateCookieNames = [
    '__Secure-authjs.session-token',
    'authjs.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.session-token',
  ];

  for (const cookieName of candidateCookieNames) {
    const rawToken = cookies[cookieName];
    if (!rawToken) continue;

    let tokenValue = rawToken;
    try {
      tokenValue = decodeURIComponent(rawToken);
    } catch {
      tokenValue = rawToken;
    }

    try {
      const payload = await decode({
        token: tokenValue,
        secret,
        salt: cookieName,
      });
      if (!payload) continue;

      const uid = String(payload.id || payload.sub || payload.email || '').trim();
      if (!uid) continue;

      const name = typeof payload.name === 'string' ? payload.name : null;
      const email = typeof payload.email === 'string' ? payload.email : null;
      const image = typeof payload.picture === 'string' ? payload.picture : null;

      return {
        id: uid,
        uid,
        email,
        name,
        displayName: name,
        image,
        photoURL: image,
      };
    } catch {
      // Try next cookie name / salt
    }
  }
  return null;
}

function buildAuthConfig(isHttps: boolean): AuthConfig {
  const { clientId, clientSecret } = getGoogleOAuthCredentials();
  const secret = getAuthSecret();

  const cookieCommon = {
    httpOnly: true,
    sameSite: (isHttps ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
    secure: isHttps,
  };

  return {
    basePath: '/api/auth',
    secret,
    trustHost: true,
    useSecureCookies: isHttps,
    session: {
      strategy: 'jwt',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    pages: {
      error: '/api/auth/popup-complete',
    },
    cookies: {
      sessionToken: {
        name: isHttps ? '__Secure-authjs.session-token' : 'authjs.session-token',
        options: { ...cookieCommon, maxAge: 30 * 24 * 60 * 60 },
      },
      callbackUrl: {
        name: isHttps ? '__Secure-authjs.callback-url' : 'authjs.callback-url',
        options: cookieCommon,
      },
      csrfToken: {
        name: isHttps ? '__Secure-authjs.csrf-token' : 'authjs.csrf-token',
        options: cookieCommon,
      },
      pkceCodeVerifier: {
        name: isHttps ? '__Secure-authjs.pkce.code_verifier' : 'authjs.pkce.code_verifier',
        options: { ...cookieCommon, maxAge: 900 },
      },
      state: {
        name: isHttps ? '__Secure-authjs.state' : 'authjs.state',
        options: { ...cookieCommon, maxAge: 900 },
      },
      nonce: {
        name: isHttps ? '__Secure-authjs.nonce' : 'authjs.nonce',
        options: cookieCommon,
      },
    },
    providers: [
      Google({
        clientId: clientId || 'unconfigured',
        clientSecret: clientSecret || 'unconfigured',
        authorization: {
          params: {
            prompt: 'select_account',
          },
        },
      }),
    ],
    callbacks: {
      async jwt({ token, user, profile }) {
        if (profile && typeof (profile as any).sub === 'string') {
          token.id = (profile as any).sub;
        } else if (user?.id) {
          token.id = user.id;
        }
        return token;
      },
      async session({ session, token }) {
        const uid = String(token.id || token.sub || '');
        const userImage =
          typeof token.picture === 'string'
            ? token.picture
            : session.user?.image || null;
        return {
          ...session,
          user: {
            ...session.user,
            id: uid,
            name: token.name ?? session.user?.name ?? null,
            email: token.email ?? session.user?.email ?? null,
            image: userImage,
          } as any,
        };
      },
      async redirect({ url, baseUrl }) {
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        try {
          const target = new URL(url);
          if (target.origin === baseUrl) return url;
        } catch {
          // fallback
        }
        return baseUrl;
      },
    },
  };
}

function getSetCookiesFromResponse(response: Response): string[] {
  const hdrs = response.headers as any;
  if (typeof hdrs.getSetCookie === 'function') {
    return hdrs.getSetCookie();
  }
  const single = response.headers.get('set-cookie');
  return single ? [single] : [];
}

function appendSetCookies(res: any, setCookies: string[]) {
  if (!setCookies.length) return;
  const existing = res.getHeader?.('Set-Cookie');
  const prev = Array.isArray(existing)
    ? existing
    : existing
    ? [String(existing)]
    : [];
  res.setHeader('Set-Cookie', [...prev, ...setCookies]);
}

function mergeCookieStrings(existingCookieHeader: string, setCookieHeaders: string[]): string {
  const map = new Map<string, string>();
  if (existingCookieHeader) {
    for (const part of existingCookieHeader.split(';')) {
      const idx = part.indexOf('=');
      if (idx === -1) continue;
      map.set(part.slice(0, idx).trim(), part.slice(idx + 1).trim());
    }
  }
  for (const sc of setCookieHeaders) {
    const firstPart = sc.split(';')[0] || '';
    const idx = firstPart.indexOf('=');
    if (idx === -1) continue;
    map.set(firstPart.slice(0, idx).trim(), firstPart.slice(idx + 1).trim());
  }
  return Array.from(map.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

function applyAuthCorsHeaders(req: any, res: any): boolean {
  const origin = typeof req?.headers?.origin === 'string' ? req.headers.origin : '';
  if (origin) {
    try {
      const parsed = new URL(origin);
      const host = parsed.hostname.toLowerCase();
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        (parsed.protocol === 'https:' &&
          (host.endsWith('.vercel.app') || host.endsWith('.run.app')))
      ) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      }
    } catch {
      // ignore invalid origin
    }
  }
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req?.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return true;
  }
  return false;
}

function reconstructAuthPathAndUrl(req: any, origin: string): {
  fullUrl: URL;
  subPath: string;
} {
  const rawUrl = String(req?.originalUrl || req?.url || '/api/auth');
  const fullUrl = new URL(rawUrl, origin);

  const rawAuthPath = req?.query?.__authPath;
  if (rawAuthPath !== undefined) {
    const joined = Array.isArray(rawAuthPath)
      ? rawAuthPath.join('/')
      : String(rawAuthPath);
    fullUrl.pathname = joined
      ? `/api/auth/${joined.replace(/^\/+/, '')}`
      : '/api/auth';
    fullUrl.searchParams.delete('__authPath');
  }

  const subPath = fullUrl.pathname.replace(/^\/api\/auth\/?/, '');
  return { fullUrl, subPath };
}

function buildWebHeadersFromNodeReq(req: any, origin: string): Headers {
  const headers = new Headers();
  const rawHeaders = req?.headers || {};
  for (const [k, v] of Object.entries(rawHeaders)) {
    if (v === undefined) continue;
    const lower = k.toLowerCase();
    if (lower === 'content-length' || lower === 'connection' || lower === 'transfer-encoding') {
      continue;
    }
    if (Array.isArray(v)) headers.set(k, v.join(', '));
    else headers.set(k, String(v));
  }
  if (!headers.get('origin') && (req?.method === 'POST' || req?.method === 'PUT')) {
    headers.set('origin', origin);
  }
  return headers;
}

function buildSerializedBody(req: any, headers: Headers): string | undefined {
  const method = String(req?.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD') return undefined;

  const body = req?.body;
  if (body === undefined || body === null) return undefined;
  if (typeof body === 'string') return body;
  if (Buffer.isBuffer(body)) return body.toString('utf8');

  const contentType = (headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(body)) {
      if (v !== undefined && v !== null) params.set(k, String(v));
    }
    return params.toString();
  }

  if (!contentType) {
    headers.set('content-type', 'application/json');
  }
  return JSON.stringify(body);
}

function renderPopupCompleteHtml(ok: boolean, errorMessage?: string | null) {
  const payload = JSON.stringify({
    type: 'SMARTSOLVE_AUTH_COMPLETE',
    ok,
    error: errorMessage || null,
  });

  const safeText = errorMessage
    ? errorMessage.replace(/[<>&"]/g, '')
    : 'Sign-in complete! Returning to SmartSolve...';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SmartSolve Google Authentication</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #09090b;
      color: #fafafa;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 24px;
      text-align: center;
    }
    .card {
      max-width: 380px;
      padding: 24px;
      border-radius: 20px;
      border: 1px solid #27272a;
      background: #111115;
    }
    .btn {
      margin-top: 16px;
      display: inline-block;
      padding: 10px 18px;
      border-radius: 12px;
      background: #22c55e;
      color: #fff;
      font-weight: 700;
      font-size: 13px;
      text-decoration: none;
      border: none;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="card">
    <h2 style="margin:0 0 8px;font-size:17px;">${ok ? 'Google Sign-In Successful' : 'Authentication Notice'}</h2>
    <p style="margin:0;font-size:13px;color:#a1a1aa;line-height:1.5;">${safeText}</p>
    <button class="btn" onclick="window.close(); window.location.replace('/');">Return to SmartSolve</button>
  </div>
  <script>
    (function() {
      var payload = ${payload};
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, '*');
          setTimeout(function() { window.close(); }, 180);
          return;
        }
      } catch (e) {}
      setTimeout(function() {
        var nextUrl = payload.ok ? '/' : ('/?authError=' + encodeURIComponent(payload.error || 'auth_failed'));
        window.location.replace(nextUrl);
      }, 300);
    })();
  </script>
</body>
</html>`;
}

export async function handleAuthRequest(req: any, res: any) {
  if (applyAuthCorsHeaders(req, res)) return;

  const { origin, host, isHttps } = getRequestOriginAndProtocol(req);
  const { fullUrl, subPath } = reconstructAuthPathAndUrl(req, origin);
  const config = buildAuthConfig(isHttps);

  // Non-secret config status helper
  if (subPath === 'config' && String(req?.method || 'GET').toUpperCase() === 'GET') {
    const creds = getGoogleOAuthCredentials();
    const hasSecret = Boolean(getAuthSecret());
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        configured: creds.configured && hasSecret,
        hasGoogleCredentials: creds.configured,
        hasAuthSecret: hasSecret,
        provider: 'google',
        engine: 'authjs',
      })
    );
  }

  // Popup/top-level callback landing page
  if (subPath === 'popup-complete') {
    const errParam = fullUrl.searchParams.get('error');
    const isOk = !errParam;
    const friendlyError = errParam
      ? errParam === 'AccessDenied'
        ? 'Google sign-in access was denied or cancelled.'
        : errParam === 'Configuration'
        ? 'Google OAuth server configuration error. Verify GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, AUTH_SECRET, and your Authorized Redirect URI.'
        : `Google authentication failed (${errParam}).`
      : null;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    return res.end(renderPopupCompleteHtml(isOk, friendlyError));
  }

  // Clean one-hop Google Sign-In initiator backed by Auth.js CSRF + PKCE
  if (subPath === 'google-start') {
    const mode = fullUrl.searchParams.get('mode') || 'redirect';
    const creds = getGoogleOAuthCredentials();
    const secret = getAuthSecret();

    if (!creds.configured || !secret) {
      const msg =
        'Google OAuth is not configured on the server yet. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and AUTH_SECRET in your environment variables.';
      if (mode === 'popup') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.end(renderPopupCompleteHtml(false, msg));
      }
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: msg }));
    }

    let postLoginCallback = `${origin}/`;
    if (mode === 'popup') {
      postLoginCallback = `${origin}/api/auth/popup-complete`;
    } else {
      const reqCb = fullUrl.searchParams.get('callbackUrl');
      if (reqCb && reqCb.startsWith('/')) {
        postLoginCallback = `${origin}${reqCb}`;
      } else if (reqCb) {
        try {
          const parsedCb = new URL(reqCb);
          if (parsedCb.origin === origin) postLoginCallback = parsedCb.toString();
        } catch {
          // keep default
        }
      }
    }

    try {
      const incomingCookie = typeof req?.headers?.cookie === 'string' ? req.headers.cookie : '';
      const csrfReq = new Request(`${origin}/api/auth/csrf`, {
        method: 'GET',
        headers: {
          host,
          ...(incomingCookie ? { cookie: incomingCookie } : {}),
        },
      });
      const csrfRes = await Auth(csrfReq, config);
      const csrfCookies = getSetCookiesFromResponse(csrfRes);
      const csrfJson = (await csrfRes.json().catch(() => ({}))) as { csrfToken?: string };
      const csrfToken = csrfJson?.csrfToken || '';

      const mergedCookies = mergeCookieStrings(incomingCookie, csrfCookies);
      const formBody = new URLSearchParams({
        csrfToken,
        callbackUrl: postLoginCallback,
      }).toString();

      const signInReq = new Request(`${origin}/api/auth/signin/google`, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          host,
          origin,
          ...(mergedCookies ? { cookie: mergedCookies } : {}),
        },
        body: formBody,
      });

      const signInRes = await Auth(signInReq, config);
      const signInCookies = getSetCookiesFromResponse(signInRes);
      appendSetCookies(res, [...csrfCookies, ...signInCookies]);

      const location = signInRes.headers.get('location');
      if (location) {
        res.statusCode = signInRes.status >= 300 && signInRes.status < 400 ? signInRes.status : 302;
        res.setHeader('Location', location);
        res.setHeader('Cache-Control', 'no-store');
        return res.end();
      }

      const fallbackText = await signInRes.text();
      res.statusCode = signInRes.status || 500;
      res.setHeader('Content-Type', signInRes.headers.get('content-type') || 'text/html');
      return res.end(fallbackText);
    } catch (err: any) {
      const msg = err?.message || 'Unable to start Google OAuth flow.';
      if (mode === 'popup') {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.end(renderPopupCompleteHtml(false, msg));
      }
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: msg }));
    }
  }

  // Standard Auth.js endpoints: /api/auth/session, /api/auth/csrf, /api/auth/providers,
  // /api/auth/signin/google, /api/auth/callback/google, /api/auth/signout, etc.
  try {
    if (!config.secret) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'AUTH_SECRET is not configured on the server.' }));
    }

    const headers = buildWebHeadersFromNodeReq(req, origin);
    const body = buildSerializedBody(req, headers);

    const webRequest = new Request(fullUrl.toString(), {
      method: String(req?.method || 'GET').toUpperCase(),
      headers,
      body,
    });

    const authResponse = await Auth(webRequest, config);
    const setCookies = getSetCookiesFromResponse(authResponse);
    appendSetCookies(res, setCookies);

    authResponse.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === 'set-cookie' || lower === 'content-length' || lower === 'transfer-encoding') {
        return;
      }
      res.setHeader(key, value);
    });

    res.statusCode = authResponse.status;
    const buf = Buffer.from(await authResponse.arrayBuffer());
    return res.end(buf);
  } catch (err: any) {
    console.error('[Auth.js Handler Error]:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        error: err?.message || 'Authentication handler encountered an internal error.',
      })
    );
  }
}

export default handleAuthRequest;
