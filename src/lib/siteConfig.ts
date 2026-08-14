export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
  }
  return 'https://wehosthere.com';
}

export function getApiUrl(): string {
  // Em produção, sempre usar URLs relativas para evitar CORS
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return ''; // Use relative URLs for same-origin requests
  }
  // Em desenvolvimento local, também usar URLs relativas
  if (typeof window !== 'undefined') {
    return ''; // Use relative URLs for local development
  }
  return '';
}

export function apiEndpoint(path: string): string {
  const base = getApiUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
}

export const SITE_URL = getSiteUrl();
export const API_URL = getApiUrl();
