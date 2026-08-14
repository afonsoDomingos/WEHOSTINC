// Rate limiter simples baseado em memória para prevenir ataques de força bruta
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

export function rateLimit(
  identifier: string,
  maxRequests: number = 5,
  windowMs: number = 60000 // 1 minuto por padrão
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    // Criar nova entrada ou resetar se expirou
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs
    };
    rateLimitMap.set(identifier, newEntry);
    
    // Limpar entradas antigas periodicamente
    if (rateLimitMap.size > 1000) {
      for (const [key, value] of rateLimitMap.entries()) {
        if (now > value.resetTime) {
          rateLimitMap.delete(key);
        }
      }
    }
    
    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime: newEntry.resetTime
    };
  }

  // Verificar se excedeu o limite
  if (entry.count >= maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }

  // Incrementar contador
  entry.count++;
  rateLimitMap.set(identifier, entry);

  return {
    success: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime
  };
}

// Função para obter identificador baseado em IP ou email
export function getRateLimitIdentifier(ip: string, email?: string): string {
  return email ? `email:${email.toLowerCase()}` : `ip:${ip}`;
}

// Limpar todas as entradas (útil para testes)
export function clearRateLimit() {
  rateLimitMap.clear();
}
