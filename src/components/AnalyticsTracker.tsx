'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/auth';
import { apiEndpoint } from '@/lib/siteConfig';
import FacebookPixel from '@/lib/facebookPixel';

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
    if (pathname.startsWith('/api') || pathname.startsWith('/admin')) return;

    // Rastrear PageView no Facebook Pixel nas navegações SPA
    FacebookPixel.trackPageView();

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

  // Actualizar presença do utilizador ou visitante (tempo real)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updatePresence = () => {
      // Não rastrear presença dentro de rotas de API ou no painel de administração
      if (pathname.startsWith('/api') || pathname.startsWith('/admin')) return;

      const sessionId = getSessionId();
      if (!sessionId) return;

      const currentUser = auth.getCurrentUser();
      const isAdmin = currentUser && auth.isAdminUser(currentUser);
      if (isAdmin) return; // Não incluir o administrador a navegar na lista de utilizadores online

      const isGuest = !currentUser || !currentUser.email;

      fetch(apiEndpoint('/api/analytics/presence'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: isGuest ? '' : currentUser.email,
          userName: isGuest ? '' : (currentUser.name || currentUser.email),
          currentPage: pathname,
          sessionId,
          isGuest,
        }),
      }).catch(() => {}); // silencioso
    };

    // Actualizar presença imediatamente ao navegar para a página
    updatePresence();

    // Heartbeat de presença a cada 35 segundos enquanto a página estiver aberta
    presenceInterval.current = setInterval(updatePresence, 35 * 1000);

    return () => {
      if (presenceInterval.current) clearInterval(presenceInterval.current);
    };
  }, [pathname]);

  return null; // componente invisível
}
