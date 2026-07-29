export interface DomainTLD {
  extension: string;
  price: number;
  label: string;
  popular?: boolean;
}

export const DOMAIN_PRICES: DomainTLD[] = [
  { extension: '.co.mz', price: 3000, label: 'Moçambique', popular: true },
  { extension: '.com', price: 1250, label: 'Global', popular: true },
  { extension: '.org.mz', price: 3000, label: 'Organizações MZ', popular: false },
  { extension: '.net', price: 1300, label: 'Tecnologia', popular: false },
];

/**
 * Sanitiza a entrada do domínio removendo caracteres inválidos ou prefixos http/www.
 */
export function sanitizeDomainName(rawInput: string): { sld: string; extension: string } {
  let cleaned = rawInput.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, '').replace(/^www\./, '');
  
  // Verificar se possui extensão conhecida
  for (const tld of DOMAIN_PRICES) {
    if (cleaned.endsWith(tld.extension)) {
      const sld = cleaned.substring(0, cleaned.length - tld.extension.length);
      return { sld, extension: tld.extension };
    }
  }

  // Se tem ponto mas não foi identificado, separa no primeiro ponto
  if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    const sld = parts[0];
    const ext = '.' + parts.slice(1).join('.');
    return { sld, extension: ext };
  }

  // Padrão .co.mz se não especificada extensão
  return { sld: cleaned, extension: '.co.mz' };
}

/**
 * Retorna o preço de uma extensão de domínio. Padrão: 3000 MT (.co.mz)
 */
export function getDomainPrice(extension: string): number {
  const found = DOMAIN_PRICES.find(t => t.extension === extension.toLowerCase());
  return found ? found.price : 3000;
}

/**
 * Simulação de verificação de disponibilidade de domínio.
 */
export interface DomainCheckResult {
  fullDomain: string;
  sld: string;
  extension: string;
  isAvailable: boolean;
  price: number;
  searchCount?: number;
  alternatives: { extension: string; fullDomain: string; price: number; isAvailable: boolean }[];
}

export function checkDomainAvailability(rawInput: string): DomainCheckResult {
  const { sld, extension } = sanitizeDomainName(rawInput);
  const cleanSld = sld.replace(/[^a-z0-9-]/g, '');

  const mainPrice = getDomainPrice(extension);
  
  // Domínios reservados/indisponíveis de demonstração
  const reserved = ['google', 'facebook', 'wehosthere', 'microsoft', 'gov', 'mz', 'apple', 'test'];
  const isAvailable = !reserved.includes(cleanSld) && cleanSld.length >= 2;

  const fullDomain = `${cleanSld}${extension}`;

  // Gerar alternativas em outras extensões
  const alternatives = DOMAIN_PRICES
    .filter(tld => tld.extension !== extension)
    .map(tld => ({
      extension: tld.extension,
      fullDomain: `${cleanSld}${tld.extension}`,
      price: tld.price,
      isAvailable: !reserved.includes(cleanSld),
    }));

  const searchCount = addDomainSearchLog(fullDomain, extension, isAvailable);

  return {
    fullDomain,
    sld: cleanSld,
    extension,
    isAvailable,
    price: mainPrice,
    searchCount,
    alternatives,
  };
}

/**
 * Consulta a API de verificação de DNS em tempo real do servidor.
 */
export async function checkDomainRealAsync(rawInput: string): Promise<DomainCheckResult> {
  try {
    const response = await fetch(`/api/domains/check?domain=${encodeURIComponent(rawInput)}`);
    if (!response.ok) {
      throw new Error('Falha na resposta da API');
    }
    const data: DomainCheckResult = await response.json();
    return data;
  } catch (err) {
    console.warn('Fallback para verificação local de domínio:', err);
    return checkDomainAvailability(rawInput);
  }
}

export interface DomainSearchLog {
  id: string;
  domain: string;
  extension: string;
  isAvailable: boolean;
  timestamp: string;
  searchCount?: number;
}

export const DOMAIN_SEARCH_LOGS: DomainSearchLog[] = [
  {
    id: 'log-1',
    domain: 'empresaexemplo.co.mz',
    extension: '.co.mz',
    isAvailable: true,
    searchCount: 1,
    timestamp: new Date(Date.now() - 300000).toISOString()
  },
  {
    id: 'log-2',
    domain: 'mcel.co.mz',
    extension: '.co.mz',
    isAvailable: false,
    searchCount: 1,
    timestamp: new Date(Date.now() - 900000).toISOString()
  }
];

export function addDomainSearchLog(domain: string, extension: string, isAvailable: boolean): number {
  const cleanDomain = domain.toLowerCase().trim();
  const existingIndex = DOMAIN_SEARCH_LOGS.findIndex(
    l => l.domain.toLowerCase().trim() === cleanDomain
  );

  let currentCount = 1;

  if (existingIndex >= 0) {
    // Se o mesmo domínio for pesquisado novamente:
    // Atualiza o horário para a hora mais recente, atualiza a disponibilidade e incrementa o contador de buscas!
    const existing = DOMAIN_SEARCH_LOGS[existingIndex];
    existing.timestamp = new Date().toISOString();
    existing.isAvailable = isAvailable;
    existing.searchCount = (existing.searchCount || 1) + 1;
    currentCount = existing.searchCount;

    // Move para o topo do histórico (tempo real)
    DOMAIN_SEARCH_LOGS.splice(existingIndex, 1);
    DOMAIN_SEARCH_LOGS.unshift(existing);
  } else {
    // Novo domínio no histórico
    DOMAIN_SEARCH_LOGS.unshift({
      id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
      domain: cleanDomain,
      extension,
      isAvailable,
      searchCount: 1,
      timestamp: new Date().toISOString()
    });
  }

  if (DOMAIN_SEARCH_LOGS.length > 100) {
    DOMAIN_SEARCH_LOGS.pop();
  }

  return currentCount;
}

