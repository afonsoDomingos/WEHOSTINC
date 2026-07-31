'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/auth';
import { apiEndpoint } from '@/lib/siteConfig';

// Gera ou reutiliza um sessionId persistido em sessionStorage
function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('_whsid');
  if (!sid) {
    sid = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem('_whsid', sid);
  }
  return sid;
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const presenceInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPage = useRef<string>('');

  // Rastrear visitas a páginas
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (pathname === lastPage.current) return;
    lastPage.current = pathname;

    // Não rastrear rotas de API ou admin
    if (pathname.startsWith('/api') || pathname === '/admin') return;

    const sessionId = getSessionId();
    const currentUser = auth.getCurrentUser();

    fetch(apiEndpoint('/api/analytics/visits'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: pathname,
        sessionId,
        userEmail: currentUser?.email || '',
        referrer: document.referrer || '',
      }),
    }).catch(() => {}); // silencioso
  }, [pathname]);

  // Actualizar presença do utilizador autenticado
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updatePresence = () => {
      const currentUser = auth.getCurrentUser();
      if (!currentUser || currentUser.role === 'admin') return;

      const sessionId = getSessionId();
      fetch(apiEndpoint('/api/analytics/presence'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          userName: currentUser.name,
          currentPage: pathname,
          sessionId,
        }),
      }).catch(() => {}); // silencioso
    };

    // Actualizar imediatamente
    updatePresence();

    // Actualizar a cada 2 minutos enquanto o utilizador está activo
    presenceInterval.current = setInterval(updatePresence, 2 * 60 * 1000);

    return () => {
      if (presenceInterval.current) clearInterval(presenceInterval.current);
    };
  }, [pathname]);

  return null; // componente invisível
}
