// Utilitário centralizado para autenticação e identificação de afiliados
// Resolve o problema de múltiplos fallbacks e inconsistência na identificação

import { auth } from './auth';

export interface AffiliateUserInfo {
  id: string;
  email: string;
  name: string;
  source: 'nextauth' | 'custom' | 'localstorage';
}

/**
 * Obtém o ID do usuário de forma padronizada
 * Prioridade: NextAuth (via useSession no client) → Custom Auth → LocalStorage
 * 
 * NOTA: Esta função deve ser usada apenas em componentes client que já obtêm
 * o userId via useSession(). Para components server-side, use a sessão NextAuth diretamente.
 */
export function getUserId(sessionUserId?: string): string {
  // 1. Se userId foi passado explicitamente (do useSession), usar prioritariamente
  if (sessionUserId) {
    console.log('[AffiliateAuth] Using provided session userId:', sessionUserId);
    return sessionUserId;
  }

  // 2. Tentar NextAuth via cookie (ler do document.cookie - não ideal mas funciona como fallback)
  if (typeof window !== 'undefined') {
    // NextAuth armazena a sessão em cookies httpOnly, não acessíveis via JS
    // Esta função NÃO deve tentar ler cookies diretamente por segurança
    // Em vez disso, componentes devem passar o userId do useSession()
    console.warn('[AffiliateAuth] No session userId provided - components should use useSession()');
  }

  // 3. Fallback para sistema customizado
  const currentUser = auth.getCurrentUser();
  if (currentUser?.id) {
    console.log('[AffiliateAuth] Using custom auth userId:', currentUser.id);
    return currentUser.id;
  }
  if (currentUser?.email) {
    console.log('[AffiliateAuth] Using custom auth email:', currentUser.email);
    return currentUser.email;
  }

  // 4. Último fallback: localStorage
  if (typeof window !== 'undefined') {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.id) {
          console.log('[AffiliateAuth] Using localStorage userId:', parsedUser.id);
          return parsedUser.id;
        }
        if (parsedUser.email) {
          console.log('[AffiliateAuth] Using localStorage email:', parsedUser.email);
          return parsedUser.email;
        }
      } catch (e) {
        console.error('[AffiliateAuth] Error parsing localStorage user:', e);
      }
    }
  }

  console.warn('[AffiliateAuth] No user identifier found');
  return '';
}

/**
 * Obtém informações completas do usuário para afiliados
 * Inclui a fonte da identificação para debugging
 */
export function getAffiliateUserInfo(): AffiliateUserInfo | null {
  const userId = getUserId();
  if (!userId) return null;

  let source: 'nextauth' | 'custom' | 'localstorage' = 'custom';
  let user: any = null;

  // Tentar identificar a fonte
  if (typeof window !== 'undefined') {
    const nextAuthSession = sessionStorage.getItem('next-auth.session-token');
    if (nextAuthSession) {
      source = 'nextauth';
    } else {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        source = 'localstorage';
      }
    }
  }

  // Obter dados do usuário
  if (source === 'custom' || source === 'localstorage') {
    user = auth.getCurrentUser();
  }

  // Se não conseguimos dados, usar pelo menos o ID
  if (!user) {
    return {
      id: userId,
      email: userId.includes('@') ? userId : '',
      name: 'Usuário',
      source
    };
  }

  return {
    id: user.id || userId,
    email: user.email || '',
    name: user.name || 'Usuário',
    source
  };
}

/**
 * Verifica se o usuário está autenticado para operações de afiliado
 */
export function isAffiliateAuthenticated(): boolean {
  return getUserId() !== '';
}

/**
 * Normaliza o userId para garantir consistência
 * Remove espaços, converte para lowercase se for email
 */
export function normalizeUserId(userId: string): string {
  if (!userId) return '';
  
  // Se parece com email, normalizar
  if (userId.includes('@')) {
    return userId.toLowerCase().trim();
  }
  
  // Se é ID, remover espaços
  return userId.trim();
}

/**
 * Valida se um userId é válido
 */
export function isValidUserId(userId: string): boolean {
  if (!userId || userId.trim() === '') return false;
  
  // Se é email, validar formato básico
  if (userId.includes('@')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(userId);
  }
  
  // Se é ID, verificar que não está vazio
  return userId.length > 0;
}
