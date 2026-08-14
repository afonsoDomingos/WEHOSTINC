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

export function middleware(request: NextRequest) {
  // Tratar solicitações de API
  if (request.nextUrl.pathname.startsWith('/api/')) {
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

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};

