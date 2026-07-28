import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns/promises';
import { DOMAIN_PRICES, sanitizeDomainName, getDomainPrice } from '@/lib/domains';

/**
 * Verifica se um domínio possui registros DNS ativos na internet.
 * Tenta resolver Name Servers (NS), registros de IP (A) ou registros de Email (MX).
 */
async function isDomainTakenViaDNS(domain: string): Promise<boolean> {
  try {
    // Configurar um timeout rápido de 2.5 segundos para evitar bloqueio
    const nsPromise = dns.resolveNs(domain);
    const aPromise = dns.resolve4(domain);
    const mxPromise = dns.resolveMx(domain);

    const results = await Promise.allSettled([nsPromise, aPromise, mxPromise]);
    
    // Se qualquer uma das consultas retornar registros válidos, o domínio está em uso
    const hasRecords = results.some(r => r.status === 'fulfilled' && Array.isArray(r.value) && r.value.length > 0);
    return hasRecords;
  } catch (error) {
    // Se falhar a resolução DNS ou estourar erro ENOTFOUND / SERVFAIL, o domínio provavelmente está livre
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawDomain = searchParams.get('domain');

  if (!rawDomain) {
    return NextResponse.json({ error: 'Parâmetro domain é obrigatório.' }, { status: 400 });
  }

  const { sld, extension } = sanitizeDomainName(rawDomain);
  const cleanSld = sld.replace(/[^a-z0-9-]/g, '');

  if (!cleanSld || cleanSld.length < 2) {
    return NextResponse.json({ error: 'Nome de domínio inválido.' }, { status: 400 });
  }

  const fullDomain = `${cleanSld}${extension}`;
  const price = getDomainPrice(extension);

  // Lista de reservas estáticas de demonstração para termos proteção extra
  const reservedWords = ['google', 'facebook', 'microsoft', 'wehosthere', 'apple', 'gov', 'co.mz', 'com'];
  let isTaken = reservedWords.includes(cleanSld);

  if (!isTaken) {
    isTaken = await isDomainTakenViaDNS(fullDomain);
  }

  const isAvailable = !isTaken;

  // Consultar disponibilidade das alternativas em paralelo
  const altTLDs = DOMAIN_PRICES.filter(tld => tld.extension !== extension);

  const alternatives = await Promise.all(
    altTLDs.map(async (tld) => {
      const altFullDomain = `${cleanSld}${tld.extension}`;
      let altTaken = reservedWords.includes(cleanSld);
      if (!altTaken) {
        altTaken = await isDomainTakenViaDNS(altFullDomain);
      }
      return {
        extension: tld.extension,
        fullDomain: altFullDomain,
        price: tld.price,
        isAvailable: !altTaken,
      };
    })
  );

  return NextResponse.json({
    fullDomain,
    sld: cleanSld,
    extension,
    isAvailable,
    price,
    alternatives,
  });
}
