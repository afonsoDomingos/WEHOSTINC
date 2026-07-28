import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns/promises';
import { DOMAIN_PRICES, sanitizeDomainName, getDomainPrice, addDomainSearchLog } from '@/lib/domains';

/**
 * Verifica se um domínio possui registros DNS ativos na internet.
 * Tenta resolver Name Servers (NS), registros de IP (A) ou registros de Email (MX).
 */
async function isDomainTakenViaDNS(domain: string): Promise<boolean> {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {}

  // 1. Tentar resolução de IP (A Record)
  try {
    const resolvePromise = dns.resolve4(domain);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DNS Timeout')), 2500)
    );
    const records = await Promise.race([resolvePromise, timeoutPromise]);
    if (Array.isArray(records) && records.length > 0) {
      return true; // Possui registros de IP ativos -> Ocupado!
    }
  } catch (error: any) {
    if (error.code === 'ENODATA' || error.code === 'ESERVFAIL') {
      return true; // Registrado no servidor DNS pai -> Ocupado!
    }
  }

  // 2. Tentar consulta de servidores de nomes (NameServers / NS)
  try {
    const nsPromise = dns.resolveNs(domain);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DNS Timeout')), 2500)
    );
    const nsRecords = await Promise.race([nsPromise, timeoutPromise]);
    if (Array.isArray(nsRecords) && nsRecords.length > 0) {
      return true; // Possui NameServers registrados -> Ocupado!
    }
  } catch (error: any) {
    if (error.code === 'ENODATA' || error.code === 'ESERVFAIL') {
      return true; // Ocupado!
    }
  }

  // 3. Tentar resolução de IP genérica (dns.lookup)
  try {
    const lookupPromise = dns.lookup(domain);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('DNS Timeout')), 2500)
    );
    const res = await Promise.race([lookupPromise, timeoutPromise]);
    if (res && res.address) {
      return true; // Ocupado!
    }
  } catch (error: any) {
    if (error.code === 'ENODATA' || error.code === 'ESERVFAIL') {
      return true; // Ocupado!
    }
  }

  return false; // Domínio 100% Livre para registro!
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

  // Registrar no histórico de pesquisas em tempo real
  addDomainSearchLog(fullDomain, extension, isAvailable);

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
