/**
 * Módulo de Automação de VPS / Servidor de Hospedagem (WEHOSTHERE)
 * Suporta integração nativa com CyberPanel API, cPanel/WHM UAPI e modo de Simulação (Mock).
 */

export interface ProvisionRequest {
  domain: string;
  clientEmail: string;
  planId: 'basic' | 'pro' | 'enterprise' | 'website_creation' | 'none';
  package?: string;
  storageMb?: number;
}

export interface EmailProvisionRequest {
  domain: string;
  emailUser: string;
  password?: string;
}

export interface VPSResponse {
  success: boolean;
  provider: string;
  message: string;
  details?: any;
}

// Configurações lidas do ambiente (.env.local)
const VPS_PROVIDER = process.env.VPS_PROVIDER || 'mock'; // 'cyberpanel' | 'cpanel' | 'whm' | 'mock'
const VPS_API_URL = process.env.VPS_API_URL || '';
const VPS_API_USER = process.env.VPS_API_USER || 'admin';
const VPS_API_PASSWORD = process.env.VPS_API_PASSWORD || '';
const VPS_API_TOKEN = process.env.VPS_API_TOKEN || '';

/**
 * 1. Provisionar novo site / conta de hospedagem na VPS
 */
export async function provisionWebsiteOnVPS(req: ProvisionRequest): Promise<VPSResponse> {
  const provider = VPS_PROVIDER.toLowerCase();

  // 1.1 Se o provedor for CyberPanel (OpenLiteSpeed / LiteSpeed Enterprise)
  if (provider === 'cyberpanel' && VPS_API_URL) {
    try {
      const response = await fetch(`${VPS_API_URL.replace(/\/$/, '')}/createWebsite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUser: VPS_API_USER,
          adminPass: VPS_API_PASSWORD,
          domainName: req.domain,
          ownerEmail: req.clientEmail,
          packageName: req.package || (req.planId === 'pro' ? 'Professional' : 'Default'),
          websiteOwner: 'admin'
        })
      });

      const data = await response.json();
      if (data.status === 1 || data.createWebsiteStatus === 1) {
        return {
          success: true,
          provider: 'cyberpanel',
          message: `Site ${req.domain} criado com sucesso no CyberPanel!`,
          details: data
        };
      } else {
        return {
          success: false,
          provider: 'cyberpanel',
          message: data.error_message || 'Erro ao criar site no CyberPanel.',
          details: data
        };
      }
    } catch (err: any) {
      console.error('Erro de conexão CyberPanel API:', err);
      return {
        success: false,
        provider: 'cyberpanel',
        message: `Falha na API da VPS CyberPanel: ${err.message}`
      };
    }
  }

  // 1.2 Se o provedor for cPanel / WHM
  if ((provider === 'cpanel' || provider === 'whm') && VPS_API_URL) {
    try {
      const response = await fetch(`${VPS_API_URL.replace(/\/$/, '')}/json-api/createacct?api.version=1&username=${req.domain.replace(/\W/g, '').slice(0, 8)}&domain=${req.domain}&plan=${req.package || 'default'}`, {
        method: 'GET',
        headers: {
          'Authorization': `whm ${VPS_API_USER}:${VPS_API_TOKEN || VPS_API_PASSWORD}`
        }
      });

      const data = await response.json();
      return {
        success: true,
        provider: 'cpanel',
        message: `Conta cPanel para ${req.domain} provisionada!`,
        details: data
      };
    } catch (err: any) {
      return {
        success: false,
        provider: 'cpanel',
        message: `Falha na API cPanel: ${err.message}`
      };
    }
  }

  // 1.3 Modo Simulado (Mock) de Desenvolvimento Seguro
  console.log(`[VPS AUTOMATION - MOCK] Site ${req.domain} provisionado para ${req.clientEmail} no plano ${req.planId}`);
  return {
    success: true,
    provider: 'mock',
    message: `[Simulação] Conta de hospedagem para ${req.domain} ativada com sucesso!`,
    details: {
      domain: req.domain,
      status: 'active',
      ip: '185.200.142.10',
      nameservers: ['ns1.wehosthere.com', 'ns2.wehosthere.com']
    }
  };
}

/**
 * 2. Criar conta de e-mail corporativo no servidor VPS
 */
export async function createEmailAccountOnVPS(req: EmailProvisionRequest): Promise<VPSResponse> {
  const provider = VPS_PROVIDER.toLowerCase();

  if (provider === 'cyberpanel' && VPS_API_URL) {
    try {
      const res = await fetch(`${VPS_API_URL.replace(/\/$/, '')}/createEmail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUser: VPS_API_USER,
          adminPass: VPS_API_PASSWORD,
          domainName: req.domain,
          userName: req.emailUser.split('@')[0],
          password: req.password || '@WeHost2026!'
        })
      });
      const data = await res.json();
      return {
        success: data.status === 1,
        provider: 'cyberpanel',
        message: data.status === 1 ? 'E-mail criado no CyberPanel!' : (data.error_message || 'Erro ao criar e-mail'),
        details: data
      };
    } catch (err: any) {
      return { success: false, provider: 'cyberpanel', message: err.message };
    }
  }

  // Modo Mock
  return {
    success: true,
    provider: 'mock',
    message: `[Simulação] Caixa de e-mail ${req.emailUser}@${req.domain} gerada no servidor.`,
    details: { email: `${req.emailUser}@${req.domain}`, quotaMb: 1024 }
  };
}

/**
 * 3. Solicitar / Emitir Certificado SSL Gratuito na VPS
 */
export async function issueSSLOnVPS(domain: string): Promise<VPSResponse> {
  const provider = VPS_PROVIDER.toLowerCase();

  if (provider === 'cyberpanel' && VPS_API_URL) {
    try {
      const res = await fetch(`${VPS_API_URL.replace(/\/$/, '')}/issueSSL`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminUser: VPS_API_USER,
          adminPass: VPS_API_PASSWORD,
          domainName: domain
        })
      });
      const data = await res.json();
      return { success: data.status === 1, provider: 'cyberpanel', message: 'SSL emitido!', details: data };
    } catch (e: any) {
      return { success: false, provider: 'cyberpanel', message: e.message };
    }
  }

  return {
    success: true,
    provider: 'mock',
    message: `[Simulação] Certificado SSL Let's Encrypt ativado para ${domain}.`
  };
}
