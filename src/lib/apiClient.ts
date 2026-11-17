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
