import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { auth, User } from '@/lib/auth';

interface UseAuthOptions {
  redirectToAdmin?: boolean;
  redirectToLogin?: boolean;
}

export function useAuth(options: UseAuthOptions = { redirectToAdmin: true, redirectToLogin: true }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    const checkAuth = async () => {
      console.log('[useAuth] Iniciando verificação de autenticação...');
      console.log('[useAuth] NextAuth status:', status);

      // Aguardar NextAuth carregar (com timeout de segurança)
      if (status === 'loading') {
        console.log('[useAuth] NextAuth ainda carregando, aguardando...');
        
        // Timeout de segurança para evitar ficar preso em loading
        timeoutId = setTimeout(() => {
          if (isMounted) {
            console.warn('[useAuth] Timeout ao aguardar NextAuth, usando fallback');
            proceedWithFallback();
          }
        }, 3000);
        
        return;
      }

      proceedWithAuthCheck();
    };

    const proceedWithAuthCheck = () => {
      if (!isMounted) return;
      
      let currentUser: User | null = null;

      // Tentar NextAuth primeiro
      if (status === 'authenticated' && session?.user) {
        console.log('[useAuth] Usuário autenticado via NextAuth');
        currentUser = {
          id: (session.user as any)?.id || session.user.email || '',
          name: session.user.name || '',
          email: session.user.email || '',
          plan: (session.user as any)?.plan || 'none',
          status: (session.user as any)?.status || 'active',
          role: (session.user as any)?.role || 'user',
          avatar: session.user.image || undefined,
          dueDate: (session.user as any)?.dueDate,
          createdAt: (session.user as any)?.createdAt || new Date().toISOString()
        };
        console.log('[useAuth] Usuário NextAuth:', currentUser.email, currentUser.role);
      }

      // Fallback para sistema customizado (se NextAuth falhar ou não estiver autenticado)
      if (!currentUser) {
        console.log('[useAuth] Tentando fallback para sistema customizado');
        currentUser = auth.getCurrentUser();
        if (currentUser) {
          console.log('[useAuth] Usuário encontrado no sistema customizado:', currentUser.email, currentUser.role);
        } else {
          console.warn('[useAuth] Nenhum usuário encontrado no sistema customizado');
        }
      }

      // Verificar se usuário existe
      if (!currentUser) {
        console.error('[useAuth] Nenhum usuário autenticado encontrado');
        if (options.redirectToLogin) {
          console.log('[useAuth] Redirecionando para login');
          router.push('/login');
        }
        if (isMounted) {
          setLoading(false);
          setAuthChecked(true);
        }
        return;
      }

      // Verificar se é admin
      if (options.redirectToAdmin && (currentUser.role === 'admin' || currentUser.email.toLowerCase() === 'admin@wehosthere.com')) {
        console.log('[useAuth] Usuário é admin, redirecionando para admin');
        router.push('/admin');
        if (isMounted) {
          setLoading(false);
          setAuthChecked(true);
        }
        return;
      }

      // Usuário autenticado com sucesso
      console.log('[useAuth] Usuário autenticado com sucesso:', currentUser.email);
      if (isMounted) {
        setUser(currentUser);
        setLoading(false);
        setAuthChecked(true);
      }
    };

    const proceedWithFallback = () => {
      console.log('[useAuth] Procedendo com fallback direto');
      const currentUser = auth.getCurrentUser();
      
      if (currentUser) {
        console.log('[useAuth] Usuário encontrado no fallback:', currentUser.email);
        
        if (options.redirectToAdmin && (currentUser.role === 'admin' || currentUser.email.toLowerCase() === 'admin@wehosthere.com')) {
          console.log('[useAuth] Usuário é admin, redirecionando para admin');
          router.push('/admin');
        } else {
          setUser(currentUser);
        }
      } else {
        console.error('[useAuth] Nenhum usuário encontrado no fallback');
        if (options.redirectToLogin) {
          router.push('/login');
        }
      }
      
      if (isMounted) {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [session, status, router, options.redirectToAdmin, options.redirectToLogin]);

  return { user, loading, authChecked, session, status };
}
