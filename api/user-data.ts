import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { decode } from '@auth/core/jwt';

interface VerifiedUser {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
}

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

const EPHEMERAL_DEV_SECRET = crypto
  .createHash('sha256')
  .update(`smartsolve-local-dev-${process.cwd()}`)
  .digest('hex');

function getAuthSecret(): string {
  const configured =
    (process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || '').trim();
  if (configured) return configured;
  const isProd =
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production';
  return isProd ? '' : EPHEMERAL_DEV_SECRET;
}

function firstHeaderValue(val: string | string[] | undefined): string {
  if (!val) return '';
  const raw = Array.isArray(val) ? val[0] : val;
  return raw.split(',')[0].trim();
}

function isRequestHttps(req: any): boolean {
  const host =
    firstHeaderValue(req?.headers?.['x-forwarded-host']) ||
    firstHeaderValue(req?.headers?.host) ||
    'localhost:3000';
  const proto = firstHeaderValue(req?.headers?.['x-forwarded-proto']);
  if (proto) return proto === 'https';
  if (req?.protocol === 'https' || req?.socket?.encrypted) return true;
  if (!(host.startsWith('localhost') || host.startsWith('127.0.0.1')) && process.env.VERCEL) {
    return true;
  }
  return false;
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
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

async function verifySessionUser(req: any): Promise<VerifiedUser | null> {
  const secret = getAuthSecret();
  if (!secret) return null;

  const cookies = parseCookies(typeof req?.headers?.cookie === 'string' ? req.headers.cookie : '');
  const names = [
    '__Secure-authjs.session-token',
    'authjs.session-token',
    '__Secure-next-auth.session-token',
    'next-auth.session-token',
  ];

  for (const name of names) {
    const raw = cookies[name];
    if (!raw) continue;
    let token = raw;
    try {
      token = decodeURIComponent(raw);
    } catch {
      token = raw;
    }
    try {
      const payload = await decode({ token, secret, salt: name });
      if (!payload) continue;
      const id = String(payload.id || payload.sub || payload.email || '').trim();
      if (!id) continue;
      return {
        id,
        email: typeof payload.email === 'string' ? payload.email : null,
        name: typeof payload.name === 'string' ? payload.name : null,
        image: typeof payload.picture === 'string' ? payload.picture : null,
      };
    } catch {
      // try next
    }
  }
  return null;
}

// AES-256-GCM HTTP-only cookie sealing so user profile & vault stay protected & stateless across Vercel lambdas
const USER_DATA_COOKIE = 'smartsolve.user_vault';

function getAesKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(`smartsolve-user-data:${secret}`).digest();
}

function encryptPayload(data: any, secret: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getAesKey(secret), iv);
  const json = JSON.stringify(data);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

function decryptPayload(token: string, secret: string): any | null {
  try {
    const buf = Buffer.from(token, 'base64url');
    if (buf.length < 29) return null;
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const enc = buf.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', getAesKey(secret), iv);
    decipher.setAuthTag(tag);
    const dec = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
    return JSON.parse(dec);
  } catch {
    return null;
  }
}

function buildCookieString(name: string, value: string, isHttps: boolean, maxAgeSec: number): string {
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

// Optional KV (Vercel KV / Upstash Redis) + local/tmp disk persistence
const memoryUserStore = new Map<string, UserStoreRecord>();

function getStoreFilePath(): string {
  if (process.env.VERCEL) return path.join('/tmp', 'smartsolve-users.json');
  return path.join(process.cwd(), '.data', 'smartsolve-users.json');
}

function readDiskStore(): Record<string, UserStoreRecord> {
  try {
    const filePath = getStoreFilePath();
    if (!fs.existsSync(filePath)) return {};
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeDiskStore(store: Record<string, UserStoreRecord>) {
  try {
    const filePath = getStoreFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(store), 'utf8');
  } catch {
    // Non-fatal in read-only serverless environments
  }
}

async function kvGet(key: string): Promise<UserStoreRecord | null> {
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
    return JSON.parse(data.result);
  } catch {
    return null;
  }
}

async function kvSet(key: string, value: UserStoreRecord): Promise<void> {
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

function defaultUserRecord(user: VerifiedUser): UserStoreRecord {
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

async function loadUserRecord(req: any, user: VerifiedUser, secret: string): Promise<UserStoreRecord> {
  const kvKey = `smartsolve:user:${user.id}`;
  const fromKv = await kvGet(kvKey);
  if (fromKv && fromKv.profile?.ownerId === user.id) {
    return fromKv;
  }

  const disk = readDiskStore();
  if (disk[user.id] && disk[user.id].profile?.ownerId === user.id) {
    memoryUserStore.set(user.id, disk[user.id]);
    return disk[user.id];
  }

  const mem = memoryUserStore.get(user.id);
  if (mem) return mem;

  // Fallback: decrypt HTTP-only sealed cookie bound strictly to user.id
  const cookies = parseCookies(typeof req?.headers?.cookie === 'string' ? req.headers.cookie : '');
  const rawCookie = cookies[USER_DATA_COOKIE];
  if (rawCookie) {
    let decodedToken = rawCookie;
    try {
      decodedToken = decodeURIComponent(rawCookie);
    } catch {
      decodedToken = rawCookie;
    }
    const decrypted = decryptPayload(decodedToken, secret);
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
  user: VerifiedUser,
  record: UserStoreRecord,
  secret: string
) {
  memoryUserStore.set(user.id, record);
  const disk = readDiskStore();
  disk[user.id] = record;
  writeDiskStore(disk);
  await kvSet(`smartsolve:user:${user.id}`, record);

  // Also keep compact profile + up to 15 recent vault items in an AES-256-GCM HTTP-only cookie (<3.6KB)
  const isHttps = isRequestHttps(req);
  const cookiePayload = {
    ownerId: user.id,
    profile: record.profile,
    vaultItems: record.vaultItems.slice(0, 12).map((item) => ({
      ...item,
      content: item.content.slice(0, 180),
    })),
  };
  const sealed = encryptPayload(cookiePayload, secret);
  if (sealed.length < 3800) {
    res.setHeader(
      'Set-Cookie',
      buildCookieString(USER_DATA_COOKIE, sealed, isHttps, 30 * 24 * 60 * 60)
    );
  }
}

function applyCors(req: any, res: any): boolean {
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
      // ignore
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

export default async function handler(req: any, res: any) {
  if (applyCors(req, res)) return;

  const secret = getAuthSecret();
  const user = await verifySessionUser(req);
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
