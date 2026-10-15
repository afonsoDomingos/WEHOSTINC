import { NextRequest, NextResponse } from 'next/server';

// 🔒 Origens permitidas para CORS — nunca usar wildcard '*' em APIs autenticadas
const ALLOWED_ORIGINS = [
  'https://wehosthere.com',
  'https://www.wehosthere.com',
  // Desenvolvimento local
  'http://localhost:3000',
  'http://localhost:3001',
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : 'https://wehosthere.com',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, x-internal-auth',
    'Access-Control-Allow-Credentials': 'true',
  };
}

const SYSTEM_SUBDOMAINS = ['www', 'api', 'admin', 'mail', 'app', 'cpanel', 'webmail', 'staging', 'dev'];

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const hostname = host.split(':')[0].toLowerCase();
  const { pathname } = request.nextUrl;

  // 1. Tratar solicitações de API e CORS
  if (pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);

    // Lidar com preflight OPTIONS
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const response = NextResponse.next();
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    return response;
  }

  // 2. Roteamento de Subdomínio para Sites Gerados por IA (*.wehosthere.com ou *.localhost)
  let subdomain = '';
  if (hostname.endsWith('.wehosthere.com')) {
    subdomain = hostname.replace('.wehosthere.com', '');
  } else if (hostname.endsWith('.localhost')) {
    subdomain = hostname.replace('.localhost', '');
  }

  if (
    subdomain &&
    !SYSTEM_SUBDOMAINS.includes(subdomain) &&
    !pathname.startsWith('/site/') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/register') &&
    !pathname.startsWith('/checkout')
  ) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/site/${subdomain}${pathname === '/' ? '' : pathname}`;
    return NextResponse.rewrite(rewriteUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files, favicon, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

