// Sistema de alertas para inconsistências críticas no sistema de afiliados
// Envia notificações por email e Slack quando problemas são detectados

import { dispatchMessage } from '@/lib/notifications';

export interface AlertConfig {
  enabled: boolean;
  emailNotifications: boolean;
  slackNotifications: boolean;
  adminEmail: string;
  slackWebhookUrl?: string;
  criticalThreshold: number; // Número de problemas críticos para disparar alerta
}

export interface AffiliateAlert {
  type: 'critical' | 'warning' | 'info';
  affiliateId: string;
  affiliateCode: string;
  affiliateEmail?: string;
  issue: string;
  description: string;
  timestamp: string;
  resolved?: boolean;
}

class AffiliateAlertManager {
  private config: AlertConfig = {
    enabled: true,
    emailNotifications: true,
    slackNotifications: false,
    adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || 'info@wehosthere.com',
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL,
    criticalThreshold: 3 // Alertar se houver 3+ problemas críticos
  };

  private activeAlerts: Map<string, AffiliateAlert> = new Map();

  /**
   * Configura o gerenciador de alertas
   */
  configure(config: Partial<AlertConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Envia um alerta de inconsistência crítica
   */
  async sendCriticalAlert(affiliateId: string, affiliateCode: string, issues: any[]): Promise<void> {
    if (!this.config.enabled) return;

    const criticalIssues = issues.filter(i => i.severity === 'critical');
    
    if (criticalIssues.length === 0) return;

    const alert: AffiliateAlert = {
      type: 'critical',
      affiliateId,
      affiliateCode,
      issue: 'Inconsistência crítica detectada',
      description: `${criticalIssues.length} problemas críticos encontrados nos dados do afiliado ${affiliateCode}`,
      timestamp: new Date().toISOString()
    };

    const alertKey = `${affiliateId}:${Date.now()}`;
    this.activeAlerts.set(alertKey, alert);

    // Enviar notificação por email
    if (this.config.emailNotifications) {
      await this.sendEmailAlert(alert, criticalIssues);
    }

    // Enviar notificação para Slack
    if (this.config.slackNotifications && this.config.slackWebhookUrl) {
      await this.sendSlackAlert(alert, criticalIssues);
    }
  }

  /**
   * Envia alerta por email
   */
  private async sendEmailAlert(alert: AffiliateAlert, issues: any[]): Promise<void> {
    try {
      const issuesText = issues.map((issue, index) => 
        `${index + 1}. ${issue.description} (Esperado: ${issue.expected}, Atual: ${issue.actual})`
      ).join('\n');

      await dispatchMessage({
        recipientEmail: this.config.adminEmail,
        recipientName: 'Administrador WEHOSTHERE',
        templateId: 'affiliate-consistency-alert',
        variables: {
          affiliate_code: alert.affiliateCode,
          affiliate_id: alert.affiliateId,
          alert_type: alert.type,
          issue_count: issues.length.toString(),
          issues: issuesText,
          timestamp: alert.timestamp
        },
        isAutomatic: true,
        eventType: 'affiliate_consistency_alert'
      });

      console.log('[AffiliateAlerts] Email de alerta enviado com sucesso');
    } catch (error) {
      console.error('[AffiliateAlerts] Erro ao enviar email de alerta:', error);
    }
  }

  /**
   * Envia alerta para Slack
   */
  private async sendSlackAlert(alert: AffiliateAlert, issues: any[]): Promise<void> {
    if (!this.config.slackWebhookUrl) return;

    try {
      const issuesText = issues.map((issue, index) => 
        `• ${issue.description}`
      ).join('\n');

      const payload = {
        text: `🚨 Alerta de Consistência de Afiliado - ${alert.type.toUpperCase()}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🚨 Alerta de Consistência de Afiliado'
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Afiliado:* ${alert.affiliateCode}`
              },
              {
                type: 'mrkdwn',
                text: `*Tipo:* ${alert.type.toUpperCase()}`
              },
              {
                type: 'mrkdwn',
                text: `*Timestamp:* ${new Date(alert.timestamp).toLocaleString('pt-MZ')}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Problemas Detectados:*\n${issuesText}`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Ver no Admin Panel'
                },
                url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://wehosthere.com'}/admin/affiliates?tab=consistency`,
                style: 'primary'
              }
            ]
          }
        ]
      };

      const response = await fetch(this.config.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log('[AffiliateAlerts] Alerta Slack enviado com sucesso');
      } else {
        console.error('[AffiliateAlerts] Erro ao enviar alerta Slack:', response.statusText);
      }
    } catch (error) {
      console.error('[AffiliateAlerts] Erro ao enviar alerta Slack:', error);
    }
  }

  /**
   * Processa o relatório de consistência e envia alertas se necessário
   */
  async processConsistencyReport(report: any): Promise<void> {
    if (!report || !report.reports) return;

    let totalCriticalIssues = 0;
    const affiliatesWithCriticalIssues: string[] = [];

    report.reports.forEach((affiliateReport: any) => {
      if (!affiliateReport.isConsistent) {
        const criticalIssues = affiliateReport.issues.filter((i: any) => i.severity === 'critical');
        if (criticalIssues.length > 0) {
          totalCriticalIssues += criticalIssues.length;
          affiliatesWithCriticalIssues.push(affiliateReport.affiliateCode);
          
          // Enviar alerta individual para afiliados com problemas críticos
          this.sendCriticalAlert(
            affiliateReport.affiliateId,
            affiliateReport.affiliateCode,
            criticalIssues
          );
        }
      }
    });

    // Enviar alerta geral se houver muitos problemas críticos
    if (totalCriticalIssues >= this.config.criticalThreshold) {
      await this.sendSystemWideAlert(totalCriticalIssues, affiliatesWithCriticalIssues);
    }
  }

  /**
   * Envia alerta geral para todo o sistema
   */
  private async sendSystemWideAlert(criticalCount: number, affectedAffiliates: string[]): Promise<void> {
    try {
      const affiliatesText = affectedAffiliates.join(', ');
      
      await dispatchMessage({
        recipientEmail: this.config.adminEmail,
        recipientName: 'Administrador WEHOSTHERE',
        templateId: 'affiliate-system-alert',
        variables: {
          critical_count: criticalCount.toString(),
          affected_affiliates: affiliatesText,
          total_affected: affectedAffiliates.length.toString(),
          timestamp: new Date().toISOString()
        },
        isAutomatic: true,
        eventType: 'affiliate_system_alert'
      });

      console.log('[AffiliateAlerts] Alerta geral do sistema enviado');
    } catch (error) {
      console.error('[AffiliateAlerts] Erro ao enviar alerta geral:', error);
    }
  }

  /**
   * Obtém alertas ativos
   */
  getActiveAlerts(): AffiliateAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Limpa alertas antigos (mais de 24 horas)
   */
  cleanupOldAlerts(): void {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    this.activeAlerts.forEach((alert, key) => {
      if (new Date(alert.timestamp).getTime() < oneDayAgo) {
        this.activeAlerts.delete(key);
      }
    });
  }

  /**
   * Marca um alerta como resolvido
   */
  markAsResolved(alertKey: string): void {
    const alert = this.activeAlerts.get(alertKey);
    if (alert) {
      alert.resolved = true;
      // Opcionalmente, enviar notificação de resolução
    }
  }
}

// Instância singleton
const affiliateAlertManager = new AffiliateAlertManager();

// Limpeza automática a cada 6 horas
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    affiliateAlertManager.cleanupOldAlerts();
  }, 6 * 60 * 60 * 1000);
}

export default affiliateAlertManager;