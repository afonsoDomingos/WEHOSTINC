import { NextResponse } from 'next/server';
import { DOMAIN_SEARCH_LOGS } from '@/lib/domains';

export async function GET() {
  return NextResponse.json({
    totalSearches: DOMAIN_SEARCH_LOGS.length,
    availableSearches: DOMAIN_SEARCH_LOGS.filter(l => l.isAvailable).length,
    logs: DOMAIN_SEARCH_LOGS
  });
}
