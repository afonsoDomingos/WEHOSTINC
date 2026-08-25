// Sistema de validação de consistência de dados para afiliados
// Garante que as estatísticas estejam sempre sincronizadas

import Affiliate from '@/lib/models/Affiliate';
import Commission from '@/lib/models/Commission';
import AffiliateClick from '@/lib/models/AffiliateClick';

export interface ConsistencyReport {
  affiliateId: string;
  affiliateCode: string;
  issues: ConsistencyIssue[];
  isConsistent: boolean;
  corrected: boolean;
  timestamp: string;
}

export interface ConsistencyIssue {
  type: 'balance_mismatch' | 'click_count_mismatch' | 'conversion_count_mismatch' | 'missing_commission' | 'orphan_commission';
  severity: 'critical' | 'warning' | 'info';
  description: string;
  expected: number;
  actual: number;
  corrected?: number;
}

/**
 * Valida a consistência dos dados de um afiliado específico
 */
export async function validateAffiliateConsistency(affiliateId: string): Promise<ConsistencyReport> {
  const issues: ConsistencyIssue[] = [];
  let corrected = false;

  try {
    // Buscar dados atuais do afiliado
    const affiliate = await Affiliate.findOne({ userId: affiliateId });
    if (!affiliate) {
      throw new Error(`Afiliado ${affiliateId} não encontrado`);
    }

    // Buscar todas as comissões do afiliado
    const commissions = await Commission.find({ affiliateId });
    
    // Buscar todos os cliques do afiliado
    const clicks = await AffiliateClick.find({ affiliateId });

    // 1. Validar saldo disponível vs comissões aprovadas
    const approvedCommissions = commissions.filter(c => c.status === 'approved');
    const approvedAmount = approvedCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    const paidCommissions = commissions.filter(c => c.status === 'paid');
    const paidAmount = paidCommissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    
    const expectedAvailableBalance = approvedAmount - paidAmount;
    
    if (Math.abs(affiliate.availableBalance - expectedAvailableBalance) > 0.01) {
      issues.push({
        type: 'balance_mismatch',
        severity: 'critical',
        description: 'Saldo disponível não corresponde à soma de comissões aprovadas menos pagas',
        expected: expectedAvailableBalance,
        actual: affiliate.availableBalance
      });

      // Corrigir automaticamente
      await Affiliate.findByIdAndUpdate(affiliate._id, {
        availableBalance: expectedAvailableBalance
      });
      corrected = true;
    }

    // 2. Validar total de ganhos vs soma de todas as comissões
    const totalCommissionsAmount = commissions.reduce((sum, c) => sum + c.commissionAmount, 0);
    
    if (Math.abs(affiliate.totalEarnings - totalCommissionsAmount) > 0.01) {
      issues.push({
        type: 'balance_mismatch',
        severity: 'critical',
        description: 'Total de ganhos não corresponde à soma de todas as comissões',
        expected: totalCommissionsAmount,
        actual: affiliate.totalEarnings
      });

      // Corrigir automaticamente
      await Affiliate.findByIdAndUpdate(affiliate._id, {
        totalEarnings: totalCommissionsAmount
      });
      corrected = true;
    }

    // 3. Validar contagem de cliques
    const actualClickCount = clicks.length;
    
    if (affiliate.totalClicks !== actualClickCount) {
      issues.push({
        type: 'click_count_mismatch',
        severity: 'warning',
        description: 'Contagem de cliques não corresponde ao número real de cliques registrados',
        expected: actualClickCount,
        actual: affiliate.totalClicks
      });

      // Corrigir automaticamente
      await Affiliate.findByIdAndUpdate(affiliate._id, {
        totalClicks: actualClickCount
      });
      corrected = true;
    }

    // 4. Validar contagem de conversões
    const convertedClicks = clicks.filter(c => c.convertedToSale);
    const actualConversionCount = convertedClicks.length;
    
    if (affiliate.totalConversions !== actualConversionCount) {
      issues.push({
        type: 'conversion_count_mismatch',
        severity: 'warning',
        description: 'Contagem de conversões não corresponde ao número real de conversões',
        expected: actualConversionCount,
        actual: affiliate.totalConversions
      });

      // Corrigir automaticamente
      await Affiliate.findByIdAndUpdate(affiliate._id, {
        totalConversions: actualConversionCount
      });
      corrected = true;
    }

    // 5. Validar taxa de conversão
    const expectedConversionRate = actualClickCount > 0 
      ? (actualConversionCount / actualClickCount) * 100 
      : 0;
    
    if (Math.abs(affiliate.conversionRate - expectedConversionRate) > 0.1) {
      issues.push({
        type: 'conversion_count_mismatch',
        severity: 'info',
        description: 'Taxa de conversão não corresponde ao cálculo real',
        expected: expectedConversionRate,
        actual: affiliate.conversionRate
      });

      // Corrigir automaticamente
      await Affiliate.findByIdAndUpdate(affiliate._id, {
        conversionRate: expectedConversionRate
      });
      corrected = true;
    }

    // 6. Validar comissões órfãs (sem afiliado correspondente)
    const orphanCommissions = commissions.filter(c => {
      return !Affiliate.findOne({ userId: c.affiliateId });
    });

    if (orphanCommissions.length > 0) {
      issues.push({
        type: 'orphan_commission',
        severity: 'critical',
        description: `${orphanCommissions.length} comissões sem afiliado correspondente`,
        expected: 0,
        actual: orphanCommissions.length
      });
    }

    // Marcar comissões como validadas
    const now = new Date().toISOString();
    await Commission.updateMany(
      { affiliateId },
      { validatedAt: now, isConsistent: issues.length === 0 }
    );

    return {
      affiliateId,
      affiliateCode: affiliate.affiliateCode,
      issues,
      isConsistent: issues.length === 0,
      corrected,
      timestamp: now
    };

  } catch (error) {
    console.error(`Erro ao validar consistência do afiliado ${affiliateId}:`, error);
    throw error;
  }
}

/**
 * Valida a consistência de todos os afiliados
 */
export async function validateAllAffiliatesConsistency(): Promise<{
  totalAffiliates: number;
  consistentAffiliates: number;
  inconsistentAffiliates: number;
  reports: ConsistencyReport[];
}> {
  const affiliates = await Affiliate.find({});
  const reports: ConsistencyReport[] = [];
  
  let consistentCount = 0;
  let inconsistentCount = 0;

  for (const affiliate of affiliates) {
    try {
      const report = await validateAffiliateConsistency(affiliate.userId);
      reports.push(report);
      
      if (report.isConsistent) {
        consistentCount++;
      } else {
        inconsistentCount++;
      }
    } catch (error) {
      console.error(`Erro ao validar afiliado ${affiliate.userId}:`, error);
    }
  }

  return {
    totalAffiliates: affiliates.length,
    consistentAffiliates: consistentCount,
    inconsistentAffiliates: inconsistentCount,
    reports
  };
}

/**
 * Valida a consistência de uma comissão específica
 */
export async function validateCommissionConsistency(commissionId: string): Promise<{
  isConsistent: boolean;
  issues: string[];
}> {
  const issues: string[] = [];
  
  try {
    const commission = await Commission.findById(commissionId);
    if (!commission) {
      return { isConsistent: false, issues: ['Comissão não encontrada'] };
    }

    // Verificar se o afiliado existe
    const affiliate = await Affiliate.findOne({ userId: commission.affiliateId });
    if (!affiliate) {
      issues.push('Afiliado correspondente não encontrado');
    }

    // Validar cálculo da comissão
    const expectedCommission = commission.orderAmount * 0.30; // 30%
    if (Math.abs(commission.commissionAmount - expectedCommission) > 0.01) {
      issues.push(`Valor da comissão incorreto. Esperado: ${expectedCommission}, Atual: ${commission.commissionAmount}`);
    }

    // Validar ordem única
    const duplicateCommissions = await Commission.find({
      orderId: commission.orderId,
      _id: { $ne: commission._id }
    });
    
    if (duplicateCommissions.length > 0) {
      issues.push(`Existem ${duplicateCommissions.length} comissões duplicadas para a mesma ordem`);
    }

    return {
      isConsistent: issues.length === 0,
      issues
    };

  } catch (error) {
    console.error(`Erro ao validar consistência da comissão ${commissionId}:`, error);
    return { isConsistent: false, issues: ['Erro ao validar comissão'] };
  }
}

/**
 * Executa validação automática periódica (pode ser chamado por um cron job)
 */
export async function runAutomaticConsistencyCheck(): Promise<{
  checked: number;
  corrected: number;
  criticalIssues: number;
  warningIssues: number;
}> {
  const result = await validateAllAffiliatesConsistency();
  
  let criticalIssues = 0;
  let warningIssues = 0;
  let correctedCount = 0;

  result.reports.forEach(report => {
    report.issues.forEach(issue => {
      if (issue.severity === 'critical') criticalIssues++;
      if (issue.severity === 'warning') warningIssues++;
    });
    if (report.corrected) correctedCount++;
  });

  return {
    checked: result.totalAffiliates,
    corrected: correctedCount,
    criticalIssues,
    warningIssues
  };
}
