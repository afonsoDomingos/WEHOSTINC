/**
 * Parser de Mensagens de Transação (M-Pesa, e-Mola, Bancos em Moçambique)
 * Extrai automaticamente: Valor, Código de Referência, Telefone e Data
 */

export interface IParsedTransaction {
  source: 'mpesa' | 'emola' | 'bank' | 'unknown';
  amount: number | null;
  reference: string | null;
  phone: string | null;
  senderName: string | null;
  dateTime: string | null;
  rawText: string;
}

export function parseMobileMoneyMessage(text: string): IParsedTransaction {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  let source: IParsedTransaction['source'] = 'unknown';
  if (lower.includes('m-pesa') || lower.includes('mpesa') || lower.includes('vodacom')) {
    source = 'mpesa';
  } else if (lower.includes('e-mola') || lower.includes('emola') || lower.includes('movitel')) {
    source = 'emola';
  } else if (lower.includes('bci') || lower.includes('bim') || lower.includes('standard') || lower.includes('transferencia')) {
    source = 'bank';
  }

  // 1. Extração do Valor (MT / MZN)
  // Ex: "Recebeu 650.00 MT", "Recebeu 1,300.00MT", "valor de 650MT", "1000.00 MZN"
  let amount: number | null = null;
  const amountPatterns = [
    /(?:recebeu|recebido|transferiu|valor de|pagou|deposito de|montante de|confirmado)\s*(?:de)?\s*([0-9]{1,3}(?:[.,\s][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+(?:[.,][0-9]{2})?)\s*(?:mt|mzn)?/i,
    /([0-9]{1,3}(?:[.,\s][0-9]{3})*(?:[.,][0-9]{2})?|[0-9]+(?:[.,][0-9]{2})?)\s*(?:mt|mzn)\b/i,
  ];

  for (const pattern of amountPatterns) {
    const match = clean.match(pattern);
    if (match && match[1]) {
      const rawNum = match[1].replace(/\s/g, '').replace(',', '.');
      const parsed = parseFloat(rawNum);
      if (!isNaN(parsed) && parsed > 0) {
        amount = parsed;
        break;
      }
    }
  }

  // 2. Extração do Código de Referência (M-Pesa tem 10-12 caracteres alfanuméricos, ex: 8J192K90A ou PP24...)
  let reference: string | null = null;
  const refPatterns = [
    /(?:ref|refer[eê]ncia|transac[çc][aã]o|txid|id transac[çc][aã]o)[:.\s]+([A-Z0-9]{8,14})/i,
    /\b([A-Z0-9]{8,14})\s+confirmado\b/i,
    /\b([0-9]{1}[A-Z0-9]{9,11})\b/,
  ];

  for (const pattern of refPatterns) {
    const match = clean.match(pattern);
    if (match && match[1]) {
      reference = match[1].toUpperCase();
      break;
    }
  }

  // 3. Extração do Número de Telefone (Moçambique: 82, 83, 84, 85, 86, 87 + 7 dígitos)
  let phone: string | null = null;
  const phoneMatch = clean.match(/(?:258)?(8[234567][0-9]{7})\b/);
  if (phoneMatch && phoneMatch[1]) {
    phone = phoneMatch[1];
  }

  // 4. Extração do Nome do Remetente (ex: "de AFONSO DOMINGOS", "de JOAO MANUEL")
  let senderName: string | null = null;
  const nameMatch = clean.match(/(?:de|from)\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ\s]{3,35})(?:\s+em|\s+no|\s+a|\s+refer[eê]ncia|\s+ref|\.|\,|$)/i);
  if (nameMatch && nameMatch[1]) {
    const candidate = nameMatch[1].trim();
    if (!candidate.toLowerCase().includes('m-pesa') && !candidate.toLowerCase().includes('vodacom')) {
      senderName = candidate;
    }
  }

  // 5. Extração de Data
  let dateTime: string | null = null;
  const dateMatch = clean.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}(?:\s+[àa]s\s+\d{1,2}:\d{2}(?::\d{2})?)?)/i);
  if (dateMatch && dateMatch[1]) {
    dateTime = dateMatch[1];
  }

  return {
    source,
    amount,
    reference,
    phone,
    senderName,
    dateTime,
    rawText: clean,
  };
}
