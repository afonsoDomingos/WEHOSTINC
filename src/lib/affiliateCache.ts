// Sistema de cache para estatísticas de afiliados
// Melhora performance e reduz carga no banco de dados

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
}

class AffiliateCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos por padrão

  /**
   * Define um valor no cache
   */
  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Obtém um valor do cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Verifica se uma chave existe e não expirou
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Verificar se expirou
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove uma chave específica do cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Limpa todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Remove todas as entradas expiradas
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Obtém estatísticas do cache
   */
  getStats(): {
    size: number;
    keys: string[];
    memoryUsage: number;
  } {
    let memoryUsage = 0;
    const keys: string[] = [];
    
    this.cache.forEach((entry, key) => {
      keys.push(key);
      try {
        memoryUsage += JSON.stringify(entry.data).length;
      } catch (e) {
        // Ignorar erros de serialização
      }
    });

    return {
      size: this.cache.size,
      keys,
      memoryUsage
    };
  }

  /**
   * Invalida cache por padrão de chave
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];
    
    this.cache.forEach((entry, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Instância singleton do cache
const affiliateCache = new AffiliateCache();

// Limpeza automática a cada 10 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    affiliateCache.cleanup();
  }, 10 * 60 * 1000);
}

/**
 * Chaves de cache padronizadas
 */
export const CacheKeys = {
  AFFILIATE_DASHBOARD: (userId: string) => `affiliate:dashboard:${userId}`,
  AFFILIATE_STATS: (userId: string) => `affiliate:stats:${userId}`,
  AFFILIATE_COMMISSIONS: (userId: string) => `affiliate:commissions:${userId}`,
  AFFILIATE_PERFORMANCE: (userId: string, period: string) => `affiliate:performance:${userId}:${period}`,
  AFFILIATE_MATERIALS: () => `affiliate:materials:all`,
  ADMIN_AFFILIATES_LIST: (status?: string) => `admin:affiliates:list${status ? `:${status}` : ''}`,
  ADMIN_COMMISSIONS: (status?: string) => `admin:commissions:${status || 'all'}`,
  ADMIN_REPORTS: (period: string) => `admin:reports:${period}`,
};

/**
 * Wrapper para operações com cache
 */
export async function withCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  // Tentar obter do cache
  const cached = affiliateCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Se não está no cache, buscar do banco
  const data = await fetchFn();
  
  // Armazenar no cache
  affiliateCache.set(key, data, ttl);
  
  return data;
}

/**
 * Invalida cache de um afiliado específico
 */
export function invalidateAffiliateCache(userId: string): void {
  affiliateCache.delete(CacheKeys.AFFILIATE_DASHBOARD(userId));
  affiliateCache.delete(CacheKeys.AFFILIATE_STATS(userId));
  affiliateCache.delete(CacheKeys.AFFILIATE_COMMISSIONS(userId));
  
  // Invalidar todas as chaves de performance para este usuário
  affiliateCache.invalidatePattern(`affiliate:performance:${userId}:`);
}

/**
 * Invalida cache administrativo
 */
export function invalidateAdminCache(): void {
  affiliateCache.invalidatePattern('admin:');
}

/**
 * Invalida cache quando dados mudam
 */
export function invalidateCacheOnChange(type: 'affiliate' | 'commission' | 'admin', id?: string): void {
  switch (type) {
    case 'affiliate':
      if (id) invalidateAffiliateCache(id);
      break;
    case 'commission':
      // Quando uma comissão muda, invalidar cache do afiliado e admin
      if (id) invalidateAffiliateCache(id);
      invalidateAdminCache();
      break;
    case 'admin':
      invalidateAdminCache();
      break;
  }
}

export default affiliateCache;