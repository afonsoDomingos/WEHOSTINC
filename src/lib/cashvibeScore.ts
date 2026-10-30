/**
 * Algoritmo de Credit Score Dinâmico para Microcrédito Cashvibe
 * Calcula uma pontuação de 0 a 1000 e classifica em Rating A, B, C ou D
 */

export interface IScoreResult {
  score: number; // 0 a 1000
  rating: 'A' | 'B' | 'C' | 'D';
  label: string;
  riskLevel: 'Baixo' | 'Moderado' | 'Elevado' | 'Crítico';
  recommendation: string;
  factors: {
    name: string;
    impact: number;
    description: string;
  }[];
}

export function calculateCreditScore(params: {
  monthlyIncome: number;
  totalLoans: number;
  paidLoans: number;
  overdueLoans: number;
  maxDaysOverdue: number;
  isBlacklisted: boolean;
}): IScoreResult {
  const {
    monthlyIncome = 0,
    totalLoans = 0,
    paidLoans = 0,
    overdueLoans = 0,
    maxDaysOverdue = 0,
    isBlacklisted = false,
  } = params;

  if (isBlacklisted) {
    return {
      score: 100,
      rating: 'D',
      label: 'Lista Negra / Bloqueado',
      riskLevel: 'Crítico',
      recommendation: 'Crédito estritamente vedado. Cliente marcado como inadimplente crônico.',
      factors: [
        { name: 'Lista Negra', impact: -900, description: 'Cliente sinalizado na Central de Risco' },
      ],
    };
  }

  let score = 550; // Pontuação base para cliente padrão
  const factors: IScoreResult['factors'] = [];

  // Fator 1: Histórico de Empréstimos Liquidados (+80 pts cada, até +240 pts)
  if (paidLoans > 0) {
    const boost = Math.min(paidLoans * 80, 240);
    score += boost;
    factors.push({
      name: 'Pontualidade Comprovada',
      impact: boost,
      description: `${paidLoans} empréstimo(s) 100% quitado(s)`,
    });
  }

  // Fator 2: Renda Mensal Declarada
  if (monthlyIncome >= 25000) {
    score += 80;
    factors.push({ name: 'Capacidade Financeira Alta', impact: 80, description: 'Renda superior a 25.000 MT/mês' });
  } else if (monthlyIncome >= 10000) {
    score += 40;
    factors.push({ name: 'Capacidade Financeira Estável', impact: 40, description: 'Renda entre 10.000 MT e 25.000 MT' });
  }

  // Fator 3: Empréstimos Atuais em Atraso (Penalidade Severa)
  if (overdueLoans > 0) {
    const penalty = overdueLoans * 120;
    score -= penalty;
    factors.push({
      name: 'Empréstimos em Atraso',
      impact: -penalty,
      description: `${overdueLoans} crédito(s) com parcelas vencidas`,
    });
  }

  // Fator 4: Dias de Atraso Acumulados
  if (maxDaysOverdue > 15) {
    score -= 180;
    factors.push({ name: 'Inadimplência Grave', impact: -180, description: `Atraso máximo de ${maxDaysOverdue} dias` });
  } else if (maxDaysOverdue > 3) {
    score -= 70;
    factors.push({ name: 'Atraso Recente', impact: -70, description: `Atraso de ${maxDaysOverdue} dias em regularização` });
  }

  // Clamp entre 100 e 1000
  score = Math.max(100, Math.min(990, Math.round(score)));

  let rating: 'A' | 'B' | 'C' | 'D' = 'C';
  let label = 'Atenção';
  let riskLevel: IScoreResult['riskLevel'] = 'Elevado';
  let recommendation = 'Exigir garantia real ou avalista para novos créditos.';

  if (score >= 800) {
    rating = 'A';
    label = 'Excelente';
    riskLevel = 'Baixo';
    recommendation = 'Aprovação rápida e elegível para limites mais elevados.';
  } else if (score >= 650) {
    rating = 'B';
    label = 'Bom';
    riskLevel = 'Moderado';
    recommendation = 'Crédito pré-aprovado nas condições normais da Cashvibe.';
  } else if (score >= 450) {
    rating = 'C';
    label = 'Risco Moderado-Alto';
    riskLevel = 'Elevado';
    recommendation = 'Conceder apenas com garantia e entrada de 50%.';
  } else {
    rating = 'D';
    label = 'Alto Risco';
    riskLevel = 'Crítico';
    recommendation = 'Reprovação recomendada. Histórico de quebra de contrato.';
  }

  return {
    score,
    rating,
    label,
    riskLevel,
    recommendation,
    factors,
  };
}
