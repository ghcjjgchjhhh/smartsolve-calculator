const rawApiBase = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

export function getApiBaseUrl(): string {
  if (/^https?:\/\/.+/i.test(rawApiBase) && !rawApiBase.includes('your-vercel-app')) {
    return rawApiBase;
  }
  return '';
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${normalizedPath}` : normalizedPath;
}

export function buildAiHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(extra || {}),
  };
  try {
    const clientKey =
      (import.meta as any).env?.VITE_GEMINI_API_KEY ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem('gemini_user_api_key') || '' : '');
    if (clientKey && clientKey.trim() && clientKey.trim() !== 'MY_GEMINI_API_KEY') {
      headers['x-gemini-key'] = clientKey.trim();
    }
  } catch {
    // ignore storage errors
  }
  return headers;
}

export async function parseJsonResponse<T = any>(resp: Response, fallbackError: string): Promise<T> {
  const rawText = await resp.text();
  let data: any = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    throw new Error(
      rawText && rawText.trim().length < 220
        ? rawText.trim()
        : `${fallbackError} (HTTP ${resp.status})`
    );
  }
  if (!resp.ok) {
    throw new Error(data?.error || `${fallbackError} (HTTP ${resp.status})`);
  }
  return data as T;
}
