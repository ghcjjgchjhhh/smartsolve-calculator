import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
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

  const rawRouteParam = req?.query?.__authRoute;
  const routeParam = Array.isArray(rawRouteParam) ? rawRouteParam[0] : rawRouteParam;
  const rawUrlPath = String(req?.originalUrl || req?.url || '').split('?')[0];

  if (routeParam === 'user-data' || rawUrlPath.startsWith('/api/user-data')) {
    return userDataHandler(req, res);
  }
  if (routeParam === 'study-rooms' || rawUrlPath.startsWith('/api/study-rooms')) {
    return studyRoomsHandler(req, res);
  }

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

// ============================================================================
// PROTECTED USER DATA & WORKSPACE SYNC HANDLER (/api/user-data)
// ============================================================================

export interface StoredProfile {
  ownerId: string;
  fullName: string;
  studyLevel: string;
  bio: string;
  photoUrl?: string;
}

export interface StoredVaultItem {
  id: string;
  ownerId: string;
  itemType: 'formula' | 'note' | 'calculation' | 'goal';
  title: string;
  content: string;
  subject: string;
  createdAtMs: number;
}

export interface StoredWorkspace {
  ownerId: string;
  displayName: string;
  pinnedFormulas: any[];
  examGoals: any[];
  recentHistory: any[];
  tutorStats: {
    topicsCompleted: number;
    formulasPracticed: number;
    totalAnswered: number;
    overallAccuracyPct: number;
    streak: number;
  };
  syncedAt: number;
}

interface UserStoreRecord {
  profile: StoredProfile;
  vaultItems: StoredVaultItem[];
  workspace: StoredWorkspace | null;
}

const USER_DATA_COOKIE = 'smartsolve.user_vault';

function getUserDataAesKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(`smartsolve-user-data:${secret}`).digest();
}

function encryptUserPayload(data: any, secret: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getUserDataAesKey(secret), iv);
  const json = JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

function decryptUserPayload(token: string, secret: string): any | null {
  try {
    const buf = Buffer.from(token, 'base64url');
    if (buf.length < 29) return null;
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', getUserDataAesKey(secret), iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    return JSON.parse(dec);
  } catch {
    return null;
  }
}

function buildUserVaultCookieString(name: string, value: string, isHttps: boolean, maxAgeSec: number): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${maxAgeSec}`,
    'HttpOnly',
    `SameSite=${isHttps ? 'None' : 'Lax'}`,
  ];
  if (isHttps) parts.push('Secure');
  return parts.join('; ');
}

const memoryUserStore = new Map<string, UserStoreRecord>();

function getUserStoreFilePath(): string {
  if (process.env.VERCEL) return path.join('/tmp', 'smartsolve-users.json');
  return path.join(process.cwd(), '.data', 'smartsolve-users.json');
}

function readUserDiskStore(): Record<string, UserStoreRecord> {
  try {
    const filePath = getUserStoreFilePath();
    if (!fs.existsSync(filePath)) return {};
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeUserDiskStore(store: Record<string, UserStoreRecord>) {
  try {
    const filePath = getUserStoreFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(store), 'utf8');
  } catch {
    // Non-fatal on read-only serverless fs
  }
}

async function kvGetJson<T>(key: string): Promise<T | null> {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  if (!url || !token) return null;
  try {
    const resp = await fetch(`${url.replace(/\/+$/, '')}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { result?: string | null };
    if (!data?.result) return null;
    return JSON.parse(data.result) as T;
  } catch {
    return null;
  }
}

async function kvSetJson(key: string, value: any): Promise<void> {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').trim();
  const token = (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '').trim();
  if (!url || !token) return;
  try {
    await fetch(`${url.replace(/\/+$/, '')}/set/${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(value)),
    });
  } catch {
    // ignore KV write failures
  }
}

function defaultUserRecord(user: AuthSessionUser): UserStoreRecord {
  return {
    profile: {
      ownerId: user.id,
      fullName: (user.name || '').slice(0, 100),
      studyLevel: 'JAMB / WAEC',
      bio: '',
      photoUrl: user.image ? user.image.slice(0, 500) : undefined,
    },
    vaultItems: [],
    workspace: null,
  };
}

async function loadUserRecord(req: any, user: AuthSessionUser, secret: string): Promise<UserStoreRecord> {
  const kvKey = `smartsolve:user:${user.id}`;
  const fromKv = await kvGetJson<UserStoreRecord>(kvKey);
  if (fromKv && fromKv.profile?.ownerId === user.id) {
    return fromKv;
  }

  const disk = readUserDiskStore();
  if (disk[user.id] && disk[user.id].profile?.ownerId === user.id) {
    memoryUserStore.set(user.id, disk[user.id]);
    return disk[user.id];
  }

  const mem = memoryUserStore.get(user.id);
  if (mem) return mem;

  const cookies = parseCookieHeader(typeof req?.headers?.cookie === 'string' ? req.headers.cookie : '');
  const rawCookie = cookies[USER_DATA_COOKIE];
  if (rawCookie) {
    let decodedToken = rawCookie;
    try {
      decodedToken = decodeURIComponent(rawCookie);
    } catch {
      decodedToken = rawCookie;
    }
    const decrypted = decryptUserPayload(decodedToken, secret);
    if (decrypted && decrypted.ownerId === user.id) {
      return {
        profile: decrypted.profile || defaultUserRecord(user).profile,
        vaultItems: Array.isArray(decrypted.vaultItems) ? decrypted.vaultItems : [],
        workspace: null,
      };
    }
  }

  return defaultUserRecord(user);
}

async function persistUserRecord(
  req: any,
  res: any,
  user: AuthSessionUser,
  record: UserStoreRecord,
  secret: string
) {
  memoryUserStore.set(user.id, record);
  const disk = readUserDiskStore();
  disk[user.id] = record;
  writeUserDiskStore(disk);
  await kvSetJson(`smartsolve:user:${user.id}`, record);

  const { isHttps } = getRequestOriginAndProtocol(req);
  const cookiePayload = {
    ownerId: user.id,
    profile: record.profile,
    vaultItems: record.vaultItems.slice(0, 12).map((item) => ({
      ...item,
      content: item.content.slice(0, 180),
    })),
  };
  const sealed = encryptUserPayload(cookiePayload, secret);
  if (sealed.length < 3800) {
    appendSetCookies(res, [buildUserVaultCookieString(USER_DATA_COOKIE, sealed, isHttps, 30 * 24 * 60 * 60)]);
  }
}

export async function userDataHandler(req: any, res: any) {
  if (applyAuthCorsHeaders(req, res)) return;

  const secret = getAuthSecret();
  const user = await getSessionUserFromReq(req);
  if (!user || !secret) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({ error: 'Authentication required. Please sign in with Google.' })
    );
  }

  try {
    const record = await loadUserRecord(req, user, secret);
    const method = String(req?.method || 'GET').toUpperCase();

    if (method === 'GET') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      return res.end(
        JSON.stringify({
          success: true,
          profile: record.profile,
          vaultItems: record.vaultItems.sort((a, b) => b.createdAtMs - a.createdAtMs),
          workspace: record.workspace,
        })
      );
    }

    if (method === 'POST') {
      const body = req?.body || {};
      const action = String(body.action || '');

      if (action === 'save_profile') {
        const nextProfile: StoredProfile = {
          ownerId: user.id,
          fullName: String(body.fullName ?? record.profile.fullName ?? user.name ?? '')
            .trim()
            .slice(0, 100),
          studyLevel:
            String(body.studyLevel ?? record.profile.studyLevel ?? 'JAMB / WAEC')
              .trim()
              .slice(0, 60) || 'JAMB / WAEC',
          bio: String(body.bio ?? record.profile.bio ?? '').trim().slice(0, 500),
          photoUrl: (user.image || record.profile.photoUrl || '').slice(0, 500) || undefined,
        };
        record.profile = nextProfile;
        await persistUserRecord(req, res, user, record, secret);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, profile: nextProfile }));
      }

      if (action === 'create_vault_item') {
        const allowedTypes = new Set(['formula', 'note', 'calculation', 'goal']);
        const itemType = allowedTypes.has(body.itemType) ? body.itemType : 'note';
        const title = String(body.title || '').trim().slice(0, 140);
        if (!title) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Item title is required.' }));
        }

        const newItem: StoredVaultItem = {
          id: `vault_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
          ownerId: user.id,
          itemType,
          title,
          content: String(body.content || '').trim().slice(0, 2000),
          subject: (String(body.subject || 'General').trim() || 'General').slice(0, 60),
          createdAtMs: Date.now(),
        };

        record.vaultItems = [newItem, ...record.vaultItems].slice(0, 100);
        await persistUserRecord(req, res, user, record, secret);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, item: newItem }));
      }

      if (action === 'delete_vault_item') {
        const itemId = String(body.itemId || '').trim();
        record.vaultItems = record.vaultItems.filter((item) => item.id !== itemId);
        await persistUserRecord(req, res, user, record, secret);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      if (action === 'save_workspace') {
        const syncedAt = Date.now();
        const workspace: StoredWorkspace = {
          ownerId: user.id,
          displayName: String(body.displayName || user.name || 'Student').slice(0, 90),
          pinnedFormulas: Array.isArray(body.pinnedFormulas) ? body.pinnedFormulas.slice(0, 40) : [],
          examGoals: Array.isArray(body.examGoals) ? body.examGoals.slice(0, 10) : [],
          recentHistory: Array.isArray(body.recentHistory) ? body.recentHistory.slice(0, 50) : [],
          tutorStats: {
            topicsCompleted: Number(body.tutorStats?.topicsCompleted) || 0,
            formulasPracticed: Number(body.tutorStats?.formulasPracticed) || 0,
            totalAnswered: Number(body.tutorStats?.totalAnswered) || 0,
            overallAccuracyPct: Number(body.tutorStats?.overallAccuracyPct) || 0,
            streak: Number(body.tutorStats?.streak) || 0,
          },
          syncedAt,
        };
        record.workspace = workspace;
        await persistUserRecord(req, res, user, record, secret);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, workspace }));
      }

      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Unknown user data action.' }));
    }

    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed.' }));
  } catch (err: any) {
    console.error('[user-data API Error]:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: err?.message || 'Unable to process user data request.' }));
  }
}

// ============================================================================
// PROTECTED COLLABORATIVE STUDY ROOMS HANDLER (/api/study-rooms)
// ============================================================================

export interface StudyRoomData {
  id: string;
  title: string;
  subject: string;
  description?: string;
  visibility: 'public' | 'private';
  ownerId: string;
  ownerName: string;
  roomCode: string;
  whiteboardLocked: boolean;
  status: 'active' | 'closed';
  createdAtMs: number;
}

export interface RoomMemberData {
  uid: string;
  displayName: string;
  role: 'owner' | 'moderator' | 'member';
  muted: boolean;
}

export interface RoomMessageData {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  type: 'chat' | 'question' | 'solution';
  content: string;
  latex?: string;
  createdAtMs: number;
}

export interface WhiteboardStrokeData {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  tool: 'pen' | 'eraser' | 'line' | 'rect' | 'circle' | 'text';
  color: string;
  width: number;
  points: number[];
  createdAtMs: number;
}

export interface RoomQuizData {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  subject: string;
  topic: string;
  status: 'active' | 'finished';
  questions: any[];
  createdAtMs: number;
}

export interface QuizSubmissionData {
  uid: string;
  displayName: string;
  score: number;
  totalQuestions: number;
  timeTakenSec: number;
  answers: string[];
}

interface StoredRoomBundle {
  room: StudyRoomData;
  members: RoomMemberData[];
  messages: RoomMessageData[];
  strokes: WhiteboardStrokeData[];
  quizzes: RoomQuizData[];
  submissionsByQuiz: Record<string, QuizSubmissionData[]>;
}

interface RoomsStoreState {
  rooms: Record<string, StoredRoomBundle>;
  invites: Record<string, string>;
}

let memoryRoomsState: RoomsStoreState | null = null;
const KV_ROOMS_KEY = 'smartsolve:study_rooms:v1';

function getRoomsFilePath(): string {
  if (process.env.VERCEL) return path.join('/tmp', 'smartsolve-study-rooms.json');
  return path.join(process.cwd(), '.data', 'smartsolve-study-rooms.json');
}

async function loadRoomsState(): Promise<RoomsStoreState> {
  const fromKv = await kvGetJson<RoomsStoreState>(KV_ROOMS_KEY);
  if (fromKv && fromKv.rooms) {
    memoryRoomsState = fromKv;
    return fromKv;
  }

  try {
    const filePath = getRoomsFilePath();
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (parsed && parsed.rooms) {
        memoryRoomsState = parsed;
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  if (!memoryRoomsState) {
    memoryRoomsState = { rooms: {}, invites: {} };
  }
  return memoryRoomsState;
}

async function saveRoomsState(state: RoomsStoreState): Promise<void> {
  memoryRoomsState = state;
  try {
    const filePath = getRoomsFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(state), 'utf8');
  } catch {
    // ignore read-only fs errors
  }
  await kvSetJson(KV_ROOMS_KEY, state);
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function generateRoomId(prefix: string): string {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
}

function isRoomMemberOrOwner(bundle: StoredRoomBundle, uid: string): boolean {
  return bundle.room.ownerId === uid || bundle.members.some((m) => m.uid === uid);
}

function getMemberRole(bundle: StoredRoomBundle, uid: string): 'owner' | 'moderator' | 'member' | null {
  if (bundle.room.ownerId === uid) return 'owner';
  const mem = bundle.members.find((m) => m.uid === uid);
  return mem ? mem.role : null;
}

export async function studyRoomsHandler(req: any, res: any) {
  if (applyAuthCorsHeaders(req, res)) return;

  const user = await getSessionUserFromReq(req);
  if (!user) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({ error: 'Authentication required. Please sign in with Google.' })
    );
  }

  try {
    const state = await loadRoomsState();
    const method = String(req?.method || 'GET').toUpperCase();
    const displayName = (user.name || user.email?.split('@')[0] || 'Student').slice(0, 90);

    if (method === 'GET') {
      const urlObj = new URL(String(req?.originalUrl || req?.url || '/api/study-rooms'), 'http://localhost');
      const roomId = urlObj.searchParams.get('roomId') || (typeof req?.query?.roomId === 'string' ? req.query.roomId : '');

      if (roomId) {
        const bundle = state.rooms[roomId];
        if (!bundle) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Study room no longer exists.' }));
        }
        if (bundle.room.visibility === 'private' && !isRoomMemberOrOwner(bundle, user.id)) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Private room requires an invite code.' }));
        }

        const latestQuiz = bundle.quizzes[0] || null;
        const submissions = latestQuiz
          ? [...(bundle.submissionsByQuiz[latestQuiz.id] || [])].sort(
              (a, b) => b.score - a.score || a.timeTakenSec - b.timeTakenSec
            )
          : [];

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-store');
        return res.end(
          JSON.stringify({
            success: true,
            room: bundle.room,
            members: bundle.members,
            messages: bundle.messages,
            strokes: bundle.strokes,
            quizzes: bundle.quizzes,
            submissions,
          })
        );
      }

      const allBundles = Object.values(state.rooms);
      const publicRooms = allBundles
        .map((b) => b.room)
        .filter((r) => r.visibility === 'public' && r.status === 'active')
        .sort((a, b) => b.createdAtMs - a.createdAtMs)
        .slice(0, 20);
      const myRooms = allBundles
        .map((b) => b.room)
        .filter((r) => r.ownerId === user.id)
        .sort((a, b) => b.createdAtMs - a.createdAtMs)
        .slice(0, 20);

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      return res.end(JSON.stringify({ success: true, publicRooms, myRooms }));
    }

    if (method === 'POST') {
      const body = req?.body || {};
      const action = String(body.action || '');

      if (action === 'create_room') {
        const title = String(body.title || '').trim().slice(0, 120);
        if (!title) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Room title is required.' }));
        }

        const roomId = generateRoomId('room');
        let code = generateRoomCode();
        while (state.invites[code]) code = generateRoomCode();

        const visibility = body.visibility === 'private' ? 'private' : 'public';
        const room: StudyRoomData = {
          id: roomId,
          title,
          subject: String(body.subject || 'Mathematics').trim().slice(0, 60),
          description: String(body.description || '').trim().slice(0, 400),
          visibility,
          ownerId: user.id,
          ownerName: displayName,
          roomCode: code,
          whiteboardLocked: false,
          status: 'active',
          createdAtMs: Date.now(),
        };

        state.rooms[roomId] = {
          room,
          members: [{ uid: user.id, displayName, role: 'owner', muted: false }],
          messages: [],
          strokes: [],
          quizzes: [],
          submissionsByQuiz: {},
        };
        state.invites[code] = roomId;
        await saveRoomsState(state);

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, room }));
      }

      if (action === 'join_room') {
        const roomId = String(body.roomId || '');
        const bundle = state.rooms[roomId];
        if (!bundle) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Study room not found.' }));
        }
        if (bundle.room.visibility === 'private' && !isRoomMemberOrOwner(bundle, user.id)) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Private room requires an invite code.' }));
        }
        if (!bundle.members.some((m) => m.uid === user.id)) {
          bundle.members.push({
            uid: user.id,
            displayName,
            role: bundle.room.ownerId === user.id ? 'owner' : 'member',
            muted: false,
          });
          await saveRoomsState(state);
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, room: bundle.room }));
      }

      if (action === 'join_by_code') {
        const code = String(body.code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        const roomId = state.invites[code];
        if (!roomId || !state.rooms[roomId]) {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Invalid or expired room invite code.' }));
        }
        const bundle = state.rooms[roomId];
        if (!bundle.members.some((m) => m.uid === user.id)) {
          bundle.members.push({
            uid: user.id,
            displayName,
            role: bundle.room.ownerId === user.id ? 'owner' : 'member',
            muted: false,
          });
          await saveRoomsState(state);
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, roomId, room: bundle.room }));
      }

      const roomId = String(body.roomId || '');
      const bundle = state.rooms[roomId];
      if (!bundle) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'Study room not found.' }));
      }
      if (!isRoomMemberOrOwner(bundle, user.id)) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ error: 'You are not a participant in this room.' }));
      }

      const role = getMemberRole(bundle, user.id);
      const isOwner = role === 'owner';
      const isMod = isOwner || role === 'moderator';
      const myMem = bundle.members.find((m) => m.uid === user.id);
      const isMuted = Boolean(myMem?.muted && !isOwner);

      if (action === 'post_message') {
        if (bundle.room.status === 'closed' || isMuted) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Posting is disabled (room closed or muted).' }));
        }
        const content = String(body.content || '').trim().slice(0, 2000);
        if (!content) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Message content is required.' }));
        }
        const msg: RoomMessageData = {
          id: generateRoomId('msg'),
          roomId,
          authorId: user.id,
          authorName: displayName,
          type: ['chat', 'question', 'solution'].includes(body.type) ? body.type : 'question',
          content,
          latex: body.latex ? String(body.latex).trim().slice(0, 1000) : undefined,
          createdAtMs: Date.now(),
        };
        bundle.messages = [...bundle.messages, msg].slice(-80);
        await saveRoomsState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, message: msg }));
      }

      if (action === 'delete_message') {
        const msgId = String(body.msgId || '');
        const target = bundle.messages.find((m) => m.id === msgId);
        if (!target || (!isMod && target.authorId !== user.id)) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Permission denied.' }));
        }
        bundle.messages = bundle.messages.filter((m) => m.id !== msgId);
        await saveRoomsState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      if (action === 'add_stroke') {
        if (bundle.room.status === 'closed' || isMuted || (bundle.room.whiteboardLocked && !isMod)) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Whiteboard is locked or you are muted.' }));
        }
        const rawPoints = Array.isArray(body.points) ? body.points : [];
        const points = rawPoints
          .slice(0, 400)
          .map((n: any) => Number(n))
          .filter((n: number) => Number.isFinite(n));
        if (points.length < 2) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Invalid stroke points.' }));
        }
        const stroke: WhiteboardStrokeData = {
          id: generateRoomId('stk'),
          roomId,
          authorId: user.id,
          authorName: displayName,
          tool: body.tool === 'eraser' ? 'eraser' : 'pen',
          color: String(body.color || '#22C55E').slice(0, 20),
          width: body.tool === 'eraser' ? 18 : 3,
          points,
          createdAtMs: Date.now(),
        };
        bundle.strokes = [...bundle.strokes, stroke].slice(-180);
        await saveRoomsState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, stroke }));
      }

      if (action === 'clear_board') {
        if (!isMod) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Only host or moderators can clear the board.' }));
        }
        bundle.strokes = [];
        await saveRoomsState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      if (action === 'toggle_lock_board') {
        if (!isMod) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Moderator permission required.' }));
        }
        bundle.room.whiteboardLocked = !bundle.room.whiteboardLocked;
        await saveRoomsState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, whiteboardLocked: bundle.room.whiteboardLocked }));
      }

      if (action === 'toggle_mute_member') {
        if (!isMod) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Moderator permission required.' }));
        }
        const targetUid = String(body.targetUid || '');
        const mem = bundle.members.find((m) => m.uid === targetUid);
        if (!mem || mem.role === 'owner') {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Cannot mute host.' }));
        }
        mem.muted = !mem.muted;
        await saveRoomsState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      if (action === 'toggle_moderator') {
        if (!isOwner) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Only host can promote moderators.' }));
        }
        const targetUid = String(body.targetUid || '');
        const mem = bundle.members.find((m) => m.uid === targetUid);
        if (!mem || mem.role === 'owner') {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Invalid member.' }));
        }
        mem.role = mem.role === 'moderator' ? 'member' : 'moderator';
        await saveRoomsState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      if (action === 'kick_member') {
        if (!isMod) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Moderator permission required.' }));
        }
        const targetUid = String(body.targetUid || '');
        const mem = bundle.members.find((m) => m.uid === targetUid);
        if (!mem || mem.role === 'owner') {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Cannot remove host.' }));
        }
        bundle.members = bundle.members.filter((m) => m.uid !== targetUid);
        await saveRoomsState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      if (action === 'close_room') {
        if (!isOwner) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Only host can close this room.' }));
        }
        bundle.room.status = 'closed';
        await saveRoomsState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      if (action === 'launch_quiz') {
        if (!isMod || bundle.room.status === 'closed') {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Moderator permission required.' }));
        }
        const questions = Array.isArray(body.questions) ? body.questions.slice(0, 10) : [];
        const quiz: RoomQuizData = {
          id: generateRoomId('quiz'),
          roomId,
          authorId: user.id,
          authorName: displayName,
          subject: String(body.subject || 'Mathematics').slice(0, 60),
          topic: String(body.topic || 'Study Quiz').slice(0, 120),
          status: 'active',
          questions,
          createdAtMs: Date.now(),
        };
        bundle.quizzes = [quiz, ...bundle.quizzes].slice(0, 5);
        bundle.submissionsByQuiz[quiz.id] = [];
        await saveRoomsState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, quiz }));
      }

      if (action === 'submit_quiz') {
        const quizId = String(body.quizId || '');
        const quiz = bundle.quizzes.find((q) => q.id === quizId);
        if (!quiz || quiz.status !== 'active' || isMuted) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Quiz round is no longer active.' }));
        }
        const existingSubs = bundle.submissionsByQuiz[quizId] || [];
        if (existingSubs.some((s) => s.uid === user.id)) {
          res.statusCode = 409;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'You already submitted this round.' }));
        }

        const answers = Array.isArray(body.answers)
          ? body.answers.map((a: any) => String(a || '-').slice(0, 2))
          : [];
        const score = quiz.questions.reduce(
          (acc, q, idx) => acc + (answers[idx] === q.correctAnswer ? 1 : 0),
          0
        );
        const sub: QuizSubmissionData = {
          uid: user.id,
          displayName,
          score,
          totalQuestions: quiz.questions.length,
          timeTakenSec: Math.max(1, Number(body.timeTakenSec) || 1),
          answers,
        };
        bundle.submissionsByQuiz[quizId] = [...existingSubs, sub];
        await saveRoomsState(state);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, submission: sub }));
      }

      if (action === 'finish_quiz') {
        if (!isMod) {
          res.statusCode = 403;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Moderator permission required.' }));
        }
        const quizId = String(body.quizId || '');
        const quiz = bundle.quizzes.find((q) => q.id === quizId);
        if (quiz) {
          quiz.status = 'finished';
          await saveRoomsState(state);
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true }));
      }

      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Unknown study room action.' }));
    }

    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed.' }));
  } catch (err: any) {
    console.error('[study-rooms API Error]:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: err?.message || 'Study room server error.' }));
  }
}

export default handleAuthRequest;
