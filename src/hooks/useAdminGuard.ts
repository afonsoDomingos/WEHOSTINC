'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { auth, User } from '@/lib/auth';

interface UseAdminGuardResult {
  user: User | null;
  loading: boolean;
  authorized: boolean;
  session: any;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

export function useAdminGuard(): UseAdminGuardResult {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authorized, setAuthorized] = useState<boolean>(false);

  const verifyRole = useCallback(async (candidate: User): Promise<boolean> => {
    // 1. Se localmente já tem role de admin ou super_admin
    if (candidate.role === 'admin' || candidate.role === 'super_admin') {
      return true;
    }

    // 2. Caso contrário (ou se acabou de ser promovido no banco), consultar a API em tempo real
    if (candidate.email) {
      try {
        const res = await fetch('/api/users?email=' + encodeURIComponent(candidate.email.trim()));
        if (res.ok) {
          const data = await res.json();
          const serverUser = data.user || (data.users && data.users.find((u: any) => u.email?.toLowerCase() === candidate.email.toLowerCase()));
          if (serverUser && (serverUser.role === 'admin' || serverUser.role === 'super_admin')) {
            console.log('[useAdminGuard] Promoção a admin confirmada no servidor para:', candidate.email);
            // Atualizar candidato
            candidate.role = serverUser.role;
            candidate.status = serverUser.status || candidate.status || 'active';
            if (serverUser.name) candidate.name = serverUser.name;
            if (serverUser.id) candidate.id = serverUser.id;
            
            // Sincronizar localStorage
            localStorage.setItem('wehosthere_auth', JSON.stringify({ user: candidate }));
            if (candidate.id) {
              localStorage.setItem(`user_${candidate.id}`, JSON.stringify(candidate));
              localStorage.setItem('userId', candidate.id);
            }
            return true;
          }
        }
      } catch (err) {
        console.warn('[useAdminGuard] Falha ao validar role com o servidor:', err);
      }
    }

    return false;
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Se o NextAuth ainda está a carregar o status da sessão, aguardar
    if (status === 'loading') {
      return;
    }

    const checkAdminAccess = async () => {
      let candidate: User | null = null;

      // 1. Tentar ler sessão do NextAuth (Google OAuth)
      if (status === 'authenticated' && session?.user) {
        const sessionRole = (session.user as any)?.role || 'user';
        candidate = {
          id: (session.user as any)?.id || session.user.email || '',
          name: session.user.name || '',
          email: session.user.email || '',
          plan: (session.user as any)?.plan || 'enterprise',
          status: (session.user as any)?.status || 'active',
          role: sessionRole as any,
          avatar: session.user.image || undefined,
          dueDate: (session.user as any)?.dueDate,
          createdAt: (session.user as any)?.createdAt || new Date().toISOString()
        };
      }

      // 2. Fallback para sistema customizado (localStorage)
      if (!candidate) {
        candidate = auth.getCurrentUser();
      }

      // Se nenhum utilizador autenticado for encontrado
      if (!candidate) {
        if (!isMounted) return;
        console.log('[useAdminGuard] Sem sessão autenticada. Redirecionando para /login');
        setAuthorized(false);
        setLoading(false);
        router.push('/login');
        return;
      }

      // 3. Verificar e validar permissões administrativas
      const isAllowed = await verifyRole(candidate);

      if (!isMounted) return;

      if (isAllowed) {
        // Garantir que a sessão local está sincronizada
        localStorage.setItem('wehosthere_auth', JSON.stringify({ user: candidate }));
        if (candidate.id) {
          localStorage.setItem('userId', candidate.id);
        }
        setUser(candidate);
        setAuthorized(true);
        setLoading(false);
      } else {
        console.warn('[useAdminGuard] Utilizador sem permissões de administrador. Redirecionando para /dashboard');
        setAuthorized(false);
        setLoading(false);
        router.push('/dashboard');
      }
    };

    checkAdminAccess();

    return () => {
      isMounted = false;
    };
  }, [session, status, router, verifyRole]);

  return { user, loading, authorized, session, status };
}
