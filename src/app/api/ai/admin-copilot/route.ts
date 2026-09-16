import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import OrderModel from '@/lib/models/Order';
import MonthlyPaymentModel from '@/lib/models/MonthlyPayment';
import TicketModel from '@/lib/models/Ticket';
import SiteModel from '@/lib/models/Site';
import AffiliateModel from '@/lib/models/Affiliate';
import CommissionModel from '@/lib/models/Commission';
import NewsletterModel from '@/lib/models/Newsletter';
import AbandonedCartModel from '@/lib/models/AbandonedCart';
import AnalyticsVisitModel from '@/lib/models/AnalyticsVisit';
import { EmailDomain } from '@/models/EmailDomain';

// Base de conhecimento pública sobre produtos, planos e suporte da WEHOSTHERE
const WEHOSTHERE_PUBLIC_KNOWLEDGE = `
Sobre a WEHOSTHERE:
- Plataforma líder de Hospedagem de Sites, Email Profissional, Registro de Domínios e Infraestruturas Cloud em Moçambique.
- Moeda padrão: Metical (MZN).
- Suporte e Contato Oficial: info@wehosthere.com | Tel/WhatsApp: +258 84 438 4702.
- Planos de Hospedagem:
  * Plano Básico (550 MT/mês): 10GB SSD, 100GB Tráfego, 2GB RAM, 5 Contas de Email Corporativo, cPanel/DirectAdmin, Certificado SSL Gratuito.
  * Plano Profissional (1.200 MT/mês): 30GB SSD NVMe, Tráfego Ilimitado, 4GB RAM, Contas de Email Ilimitadas, Backup Automático, SSL Gratuito.
  * Plano Enterprise / VPS (3.500 MT/mês): 100GB NVMe SSD, Recursos Dedicados, 8GB RAM, IP Dedicado, Suporte VIP 24/7.
  * Hospedagem WordPress: Otimizada com cache LiteSpeed, instalação em 1 clique e atualizações automáticas.
- Registo de Domínios:
  * .co.mz : 2.500 MT / ano (Identidade oficial para empresas em Moçambique, configuração DNS completa).
  * .com : 1.500 MT / ano.
  * .org, .net, .mz e outros disponíveis.
- Criação e Desenvolvimento de Sites:
  * Sites Profissionais completos e responsivos a partir de 12.000 MT (Landing Pages, Lojas Virtuais com M-Pesa, Portais Corporativos e Sistemas sob medida).
- Email Corporativo (Migadu):
  * Webmail moderno e seguro (webmail.seudominio.co.mz ou via Migadu).
  * Servidores de Entrada (IMAP): imap.migadu.com (Porta 993 SSL).
  * Servidores de Saída (SMTP): smtp.migadu.com (Porta 465 SSL ou 587 STARTTLS).
  * Registos DNS oficiais:
    - MX 1: aspmx.migadu.com (Prioridade 10)
    - MX 2: aspmx2.migadu.com (Prioridade 20)
    - SPF: v=spf1 include:spf.migadu.com ~all
- Métodos de Pagamento em Moçambique:
  * M-Pesa (Vodacom) com confirmação instantânea.
  * E-Mola (Movitel).
  * Cartões de Débito / Crédito Visa e Mastercard (ScalePay).
  * Transferência Bancária (BCI, Standard Bank, Millennium BIM).
- Links Úteis para Navegação:
  * Planos de Hospedagem: [/hospedagem](/hospedagem)
  * Pesquisa e Registo de Domínios: [/dominios](/dominios)
  * Pedir Orçamento de Criação de Site: [/site-quote](/site-quote)
  * Email Corporativo: [/email-profissional](/email-profissional)
  * Servidores VPS: [/vps](/vps)
  * Entrar / Painel do Cliente: [/dashboard](/dashboard)
  * Abrir Chamado de Suporte: [/dashboard/tickets](/dashboard/tickets)
  * Teste de Pagamento: [/test-payment](/test-payment)
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query = '', history = [], userRole: clientRole, userEmail: clientEmail } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Comando ou pergunta é obrigatório' }, { status: 400 });
    }

    const cleanQuery = query.trim();

    // 1. Verificar autenticação e permissões reais no MongoDB
    let isAdmin = false;
    let verifiedEmail: string | null = null;

    if (clientEmail && typeof clientEmail === 'string') {
      const emailLower = clientEmail.toLowerCase().trim();
      verifiedEmail = emailLower;
      if (emailLower === 'info@wehosthere.com' || emailLower === 'admin@wehosthere.com') {
        isAdmin = true;
      } else {
        try {
          await connectDB();
          const dbUser = await UserModel.findOne({
            $or: [
              { email: emailLower },
              { email: { $regex: new RegExp(`^${emailLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
            ]
          }).lean() as any;

          if (dbUser && (dbUser.role === 'admin' || dbUser.role === 'super_admin')) {
            isAdmin = true;
          }
        } catch (_) {}
      }
    }

    // 2. Montar contexto de acordo com o papel (Role) do utilizador
    let systemPrompt = '';
    let liveData: any = {};
    let clientData: any = null;

    if (isAdmin) {
      // ══════════════════════════════════════════════════════════════
      // 👑 MODO ADMINISTRADOR: Contexto total de gestão da empresa
      // ══════════════════════════════════════════════════════════════
      liveData = {
        users: { total: 0, active: 0, pending: 0, recent: [] },
        orders: { total: 0, completed: 0, pending: 0, totalAmount: 0, recent: [] },
        payments: { pendingCount: 0, overdueList: [] },
        tickets: { total: 0, open: 0, recent: [] },
        sites: { total: 0, recent: [] },
        domains: { total: 0, list: [] },
        affiliates: { total: 0, pendingCommissions: 0, pendingAmount: 0 },
        newsletter: { totalSubscribers: 0 },
        abandonedCarts: { count: 0 },
        analytics: { totalVisits: 0 }
      };

      try {
        await connectDB();
        const [
          usersTotal, usersActive, usersPending, recentUsers,
          ordersTotal, ordersCompleted, ordersPending, recentOrders,
          pendingPayments, ticketsTotal, ticketsOpen, recentTickets,
          sitesTotal, domainsList, affiliatesTotal, pendingCommissions,
          newsletterCount, abandonedCartsCount, visitsCount
        ] = await Promise.all([
          UserModel.countDocuments({}).catch(() => 0),
          UserModel.countDocuments({ status: 'active' }).catch(() => 0),
          UserModel.countDocuments({ status: 'pending' }).catch(() => 0),
          UserModel.find({}).sort({ createdAt: -1 }).limit(5).select('name email plan status role createdAt').lean().catch(() => []),
          OrderModel.countDocuments({}).catch(() => 0),
          OrderModel.countDocuments({ status: 'completed' }).catch(() => 0),
          OrderModel.countDocuments({ status: 'pending' }).catch(() => 0),
          OrderModel.find({}).sort({ createdAt: -1 }).limit(5).select('id clientName clientEmail serviceName amount paymentMethod status createdAt').lean().catch(() => []),
          MonthlyPaymentModel.find({ status: { $in: ['pending', 'overdue', 'partial'] } }).limit(10).select('clientName clientEmail amount remainingAmount status month year').lean().catch(() => []),
          TicketModel.countDocuments({}).catch(() => 0),
          TicketModel.countDocuments({ status: { $in: ['open', 'in_progress'] } }).catch(() => 0),
          TicketModel.find({ status: { $in: ['open', 'in_progress'] } }).sort({ createdAt: -1 }).limit(5).select('id userName userEmail subject priority status createdAt').lean().catch(() => []),
          SiteModel.countDocuments({}).catch(() => 0),
          EmailDomain.find({}).limit(10).select('domainName status provider canSend canReceive').lean().catch(() => []),
          AffiliateModel.countDocuments({}).catch(() => 0),
          CommissionModel.find({ status: 'pending' }).select('affiliateCode commissionAmount serviceType').lean().catch(() => []),
          NewsletterModel.countDocuments({}).catch(() => 0),
          AbandonedCartModel.countDocuments({ status: 'abandoned' }).catch(() => 0),
          AnalyticsVisitModel.countDocuments({}).catch(() => 0),
        ]);

        liveData.users = { total: usersTotal, active: usersActive, pending: usersPending, recent: recentUsers };
        liveData.orders = { total: ordersTotal, completed: ordersCompleted, pending: ordersPending, recent: recentOrders };
        liveData.payments = { pendingCount: pendingPayments.length, overdueList: pendingPayments };
        liveData.tickets = { total: ticketsTotal, open: ticketsOpen, recent: recentTickets };
        liveData.sites = { total: sitesTotal };
        liveData.domains = { total: domainsList.length, list: domainsList };
        liveData.affiliates = {
          total: affiliatesTotal,
          pendingCommissions: pendingCommissions.length,
          pendingAmount: pendingCommissions.reduce((acc, c: any) => acc + (c.commissionAmount || 0), 0),
        };
        liveData.newsletter = { totalSubscribers: newsletterCount };
        liveData.abandonedCarts = { count: abandonedCartsCount };
        liveData.analytics = { totalVisits: visitsCount };
      } catch (dbErr) {
        console.warn('[AI Copilot] Erro ao consultar MongoDB para admin:', dbErr);
      }

      systemPrompt = `
Você é o WEHOSTHERE AI Copilot, assistente operacional e executivo de elite do painel de administração da WEHOSTHERE.

DADOS EM TEMPO REAL DO BANCO DE DADOS:
- UTILIZADORES: Total: ${liveData.users.total} | Ativos: ${liveData.users.active} | Pendentes: ${liveData.users.pending} | Recentes: ${JSON.stringify(liveData.users.recent)}
- PEDIDOS: Total: ${liveData.orders.total} | Concluídos: ${liveData.orders.completed} | Pendentes: ${liveData.orders.pending} | Recentes: ${JSON.stringify(liveData.orders.recent)}
- FATURAÇÃO: Faturas Pendentes: ${liveData.payments.pendingCount} | Lista: ${JSON.stringify(liveData.payments.overdueList)}
- SUPORTE: Total: ${liveData.tickets.total} | Abertos: ${liveData.tickets.open} | Lista: ${JSON.stringify(liveData.tickets.recent)}
- DOMÍNIOS: ${liveData.domains.total} (Detalhes: ${JSON.stringify(liveData.domains.list)})
- AFILIADOS: Total: ${liveData.affiliates.total} | Comissões Pendentes: ${liveData.affiliates.pendingCommissions} (${liveData.affiliates.pendingAmount} MZN)

${WEHOSTHERE_PUBLIC_KNOWLEDGE}

REGRAS OBRIGATÓRIAS:
1. NUNCA USE ASTERISCOS (**) OU (*) PARA FORMATAÇÃO. Responda em texto limpo.
2. NUNCA USE EMOJIS AMADORES (🤖, 👥, 🛒, 💰, etc.). Use marcadores simples (•) e linguagem executiva.
3. Inclua links Markdown para o painel (ex: [/admin/pagamentos-mensais](/admin/pagamentos-mensais), [/admin/comunicacao](/admin/comunicacao)).
`;

    } else {
      // ══════════════════════════════════════════════════════════════
      // 👤 MODO CLIENTE / VISITANTE: 100% SEGURO e ISOLADO
      // ══════════════════════════════════════════════════════════════
      if (verifiedEmail) {
        try {
          await connectDB();
          const [myOrders, myTickets] = await Promise.all([
            OrderModel.find({ clientEmail: verifiedEmail }).sort({ createdAt: -1 }).limit(5).select('serviceName amount status createdAt paymentMethod').lean().catch(() => []),
            TicketModel.find({ userEmail: verifiedEmail }).sort({ createdAt: -1 }).limit(5).select('subject status priority createdAt').lean().catch(() => []),
          ]);
          clientData = {
            orders: myOrders,
            tickets: myTickets,
          };
        } catch (_) {}
      }

      systemPrompt = `
Você é o WEHOSTHERE AI Copilot, o assistente inteligente oficial de atendimento, vendas e suporte da WEHOSTHERE (Moçambique).

${WEHOSTHERE_PUBLIC_KNOWLEDGE}

${clientData ? `
INFORMAÇÕES DO CLIENTE CONECTADO:
- Email do Cliente: ${verifiedEmail}
- Meus Pedidos Recentes: ${JSON.stringify(clientData.orders)}
- Meus Chamados de Suporte: ${JSON.stringify(clientData.tickets)}
` : ''}

DIRETRIZES E RESTRIÇÕES DE SEGURANÇA CRÍTICAS:
1. RESTRIÇÃO ABSOLUTA DE DADOS ADMINISTRATIVOS: Você NÃO tem acesso e NUNCA deve responder ou divulgar faturamento global da empresa, lucros, dados de outros clientes, listas de utilizadores, senhas, dívidas gerais ou qualquer informação interna do painel admin.
2. Se o utilizador perguntar sobre métricas financeiras globais da empresa ou dados de outros clientes, responda cordialmente:
   "Por motivos de privacidade e segurança, dados administrativos e financeiros globais são confidenciais. Posso ajudá-lo com os nossos planos, serviços, configurações de domínio ou suporte técnico."
3. NUNCA USE ASTERISCOS (**) OU (*) PARA FORMATAÇÃO. Responda com texto limpo, marcadores simples (•) e quebras de linha elegantes.
4. NUNCA USE EMOJIS AMADORES (como 🤖, 👥, 🛒, 💰, etc.).
5. Seja sempre prestativo, cordial, profissional e oriente o cliente com links clicáveis como [/hospedagem](/hospedagem), [/dominios](/dominios), [/site-quote](/site-quote), [/dashboard/tickets](/dashboard/tickets) ou [/dashboard](/dashboard).
6. Ajude clientes a escolher o plano ideal, entender o registo de domínios .co.mz, configurar contas de email Migadu e formas de pagamento em Moçambique (M-Pesa, E-Mola, Cartão).
`;
    }

    // 3. Tentar Google Gemini se a chave existir
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const contents = [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...history.map((h: any) => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content.replace(/\*\*/g, '').replace(/\*/g, '') }]
          })),
          { role: 'user', parts: [{ text: cleanQuery }] }
        ];

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            const sanitized = reply.replace(/\*\*/g, '').replace(/\*/g, '');
            return NextResponse.json({ success: true, answer: sanitized, provider: 'gemini' });
          }
        }
      } catch (err) {
        console.warn('[AI Copilot] Gemini API Error:', err);
      }
    }

    // 4. Tentar OpenAI se a chave existir
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              ...history.map((h: any) => ({ role: h.role, content: h.content.replace(/\*\*/g, '').replace(/\*/g, '') })),
              { role: 'user', content: cleanQuery }
            ],
            temperature: 0.7,
          }),
        });

        if (openaiRes.ok) {
          const data = await openaiRes.json();
          const reply = data?.choices?.[0]?.message?.content;
          if (reply) {
            const sanitized = reply.replace(/\*\*/g, '').replace(/\*/g, '');
            return NextResponse.json({ success: true, answer: sanitized, provider: 'openai' });
          }
        }
      } catch (err) {
        console.warn('[AI Copilot] OpenAI API Error:', err);
      }
    }

    // 5. Motor Inteligente Nativo da WEHOSTHERE com isolamento de segurança
    const smartLocalAnswer = isAdmin
      ? generateAdminLocalResponse(cleanQuery, liveData)
      : generateClientLocalResponse(cleanQuery, clientData);

    return NextResponse.json({ success: true, answer: smartLocalAnswer, provider: 'local-engine-v3' });

  } catch (error) {
    console.error('[AI Copilot] Erro no processamento:', error);
    return NextResponse.json({ error: 'Ocorreu um erro ao processar o seu comando' }, { status: 500 });
  }
}

// 👑 Respostas Locais para Administrador
function generateAdminLocalResponse(query: string, data: any): string {
  const lower = query.toLowerCase();

  if (lower.includes('último') || lower.includes('recent') || lower.includes('utilizador') || lower.includes('cliente')) {
    if (data.users.recent && data.users.recent.length > 0) {
      const list = data.users.recent.map((u: any, idx: number) => 
        `${idx + 1}. ${u.name || 'Sem nome'} (${u.email}) — Plano: ${u.plan || 'Nenhum'} | Estado: ${u.status === 'active' ? 'Ativo' : 'Pendente'}`
      ).join('\n');
      return `Utilizadores Registados Recentemente:\n\n${list}\n\n• Total de Contas: ${data.users.total} (${data.users.active} ativas, ${data.users.pending} pendentes)\n\nGerir utilizadores em: [/admin](/admin)`;
    }
    return `Total de Utilizadores: ${data.users.total} registados (${data.users.active} ativos).\nConsulte a lista completa em [/admin](/admin)`;
  }

  if (lower.includes('pedido') || lower.includes('venda') || lower.includes('compra')) {
    if (data.orders.recent && data.orders.recent.length > 0) {
      const list = data.orders.recent.map((o: any, idx: number) =>
        `${idx + 1}. ${o.clientName || o.clientEmail} — ${o.serviceName} | ${o.amount?.toLocaleString('pt-MZ')} MZN (${o.paymentMethod}) — Estado: ${o.status}`
      ).join('\n');
      return `Relatório de Pedidos & Vendas:\n\n• Total de Pedidos: ${data.orders.total}\n• Concluídos: ${data.orders.completed} | Pendentes: ${data.orders.pending}\n\nÚltimos Pedidos:\n${list}\n\nAcompanhar vendas em [/admin/notifications](/admin/notifications)`;
    }
    return `Total de Pedidos Registados: ${data.orders.total} (${data.orders.completed} concluídos).`;
  }

  if (lower.includes('fatura') || lower.includes('pagamento') || lower.includes('devedor') || lower.includes('atras')) {
    if (data.payments.overdueList && data.payments.overdueList.length > 0) {
      const list = data.payments.overdueList.map((p: any, idx: number) =>
        `${idx + 1}. ${p.clientName || p.clientEmail} — ${p.remainingAmount || p.amount} MZN (Mês ${p.month}/${p.year}) — Estado: ${p.status}`
      ).join('\n');
      return `Faturas com Ação Pendente (${data.payments.pendingCount}):\n\n${list}\n\nGerir cobranças e lançar pagamentos em: [/admin/pagamentos-mensais](/admin/pagamentos-mensais)`;
    }
    return `Finanças: Não existem faturas em atraso no momento. Todas as mensalidades estão em dia.\nVer balanço em: [/admin/pagamentos-mensais](/admin/pagamentos-mensais)`;
  }

  if (lower.includes('ticket') || lower.includes('suporte') || lower.includes('chamado')) {
    if (data.tickets.recent && data.tickets.recent.length > 0) {
      const list = data.tickets.recent.map((t: any, idx: number) =>
        `${idx + 1}. [${t.priority?.toUpperCase() || 'MÉDIA'}] ${t.subject} — ${t.userName} (${t.userEmail})`
      ).join('\n');
      return `Tickets de Suporte em Aberto (${data.tickets.open}):\n\n${list}\n\nResponder aos clientes no painel de tickets.`;
    }
    return `Suporte: Não há tickets pendentes de resposta no momento.`;
  }

  if (lower.includes('afiliado') || lower.includes('comiss')) {
    return `Programa de Afiliados:\n\n• Total de Afiliados: ${data.affiliates.total}\n• Comissões Pendentes de Saque: ${data.affiliates.pendingCommissions} (Total: ${data.affiliates.pendingAmount?.toLocaleString('pt-MZ') || 0} MZN)\n\nGerir saques e aprovar comissões em: [/admin/affiliates](/admin/affiliates)`;
  }

  return `WEHOSTHERE AI Copilot — Painel Executivo:\n\n` +
    `• Utilizadores: ${data.users.total} (${data.users.active} ativos)\n` +
    `• Pedidos: ${data.orders.total} (${data.orders.completed} concluídos)\n` +
    `• Faturas Pendentes: ${data.payments.pendingCount}\n` +
    `• Tickets Abertos: ${data.tickets.open}\n` +
    `• Sites Ativos: ${data.sites.total} | Domínios: ${data.domains.total}\n\n` +
    `Como posso ajudar com a operação da plataforma?`;
}

// 👤 Respostas Locais para Clientes e Visitantes (Com total isolamento e foco comercial/técnico)
function generateClientLocalResponse(query: string, clientData: any): string {
  const lower = query.toLowerCase();

  // Tentativa de obter dados administrativos confidenciais -> Bloqueio amigável
  if (
    lower.includes('faturamento') || 
    lower.includes('lucro') || 
    lower.includes('quantos utilizadores') || 
    lower.includes('lista de clientes') || 
    lower.includes('quem são os clientes') || 
    lower.includes('devedores') ||
    lower.includes('receita total') ||
    lower.includes('painel admin')
  ) {
    return `Por motivos de segurança e privacidade corporativa, informações financeiras globais e dados administrativos da WEHOSTHERE são estritamente confidenciais.\n\nPosso ajudá-lo com:\n• Escolha do melhor plano de hospedagem para o seu site\n• Registo e pesquisa de domínios .co.mz\n• Configuração de email profissional no seu telemóvel ou Outlook\n• Criação de sites sob medida\n\nConsulte os nossos serviços em [/hospedagem](/hospedagem) ou fale connosco pelo WhatsApp (+258 84 438 4702).`;
  }

  // Planos de Hospedagem
  if (lower.includes('plano') || lower.includes('hospedagem') || lower.includes('preço') || lower.includes('custo') || lower.includes('quanto custa')) {
    return `Planos de Hospedagem de Sites WEHOSTHERE:\n\n` +
      `• Plano Básico (550 MT/mês):\n  - 10GB SSD de alta velocidade\n  - 100GB de Tráfego mensal\n  - 5 Contas de Email Profissional\n  - Certificado SSL Gratuito\n\n` +
      `• Plano Profissional (1.200 MT/mês) — Mais Popular:\n  - 30GB SSD NVMe ultrarrápido\n  - Tráfego Ilimitado\n  - Contas de Email Ilimitadas\n  - Backups Automáticos\n\n` +
      `• Plano Enterprise / VPS (3.500 MT/mês):\n  - 100GB SSD NVMe com recursos dedicados\n  - IP Dedicado e Suporte VIP 24/7\n\n` +
      `Pode contratar ou saber mais detalhes em: [/hospedagem](/hospedagem)`;
  }

  // Domínios (.co.mz, .com, etc.)
  if (lower.includes('domínio') || lower.includes('.co.mz') || lower.includes('.com') || lower.includes('registar')) {
    return `Registo de Domínios na WEHOSTHERE:\n\n` +
      `• Domínio .co.mz: 2.500 MT / ano (Identidade oficial para empresas em Moçambique)\n` +
      `• Domínio .com: 1.500 MT / ano\n` +
      `• Domínios .org / .net: Disponíveis a preços competitivos\n\n` +
      `O registo inclui gestão completa de DNS e ativação rápida.\n` +
      `Pesquise a disponibilidade do seu domínio em: [/dominios](/dominios)`;
  }

  // Criação de Sites
  if (lower.includes('site') || lower.includes('criar') || lower.includes('desenvolver') || lower.includes('loja') || lower.includes('orçamento')) {
    return `Criação de Sites Profissionais WEHOSTHERE:\n\n` +
      `Desenvolvemos websites modernos, 100% responsivos para telemóveis e otimizados para o Google:\n` +
      `• Sites Institucionais e Corporativos\n` +
      `• Lojas Virtuais com Pagamento por M-Pesa / Cartão\n` +
      `• Landing Pages de Alta Conversão\n` +
      `• Sistemas Web Sob Medida\n\n` +
      `Planos de criação a partir de 12.000 MT. Peça uma proposta personalizada em: [/site-quote](/site-quote)`;
  }

  // Configuração de Email / DNS
  if (lower.includes('email') || lower.includes('outlook') || lower.includes('migadu') || lower.includes('dns') || lower.includes('imap') || lower.includes('smtp')) {
    return `Configuração de Email Corporativo WEHOSTHERE:\n\n` +
      `• Webmail direto: webmail.seudominio.co.mz (ou através da plataforma Migadu)\n` +
      `• Servidor de Entrada (IMAP): imap.migadu.com (Porta 993, SSL/TLS ativado)\n` +
      `• Servidor de Saída (SMTP): smtp.migadu.com (Porta 465, SSL/TLS ativado)\n` +
      `• Nome de Utilizador: o seu email completo (ex: nome@seudominio.co.mz)\n\n` +
      `Registos DNS Oficiais:\n` +
      `• MX 1: aspmx.migadu.com (Prioridade 10)\n` +
      `• MX 2: aspmx2.migadu.com (Prioridade 20)\n` +
      `• SPF: v=spf1 include:spf.migadu.com ~all\n\n` +
      `Mais informações em: [/email-profissional](/email-profissional)`;
  }

  // Pagamentos (M-Pesa, E-Mola, Cartão)
  if (lower.includes('pagamento') || lower.includes('m-pesa') || lower.includes('emola') || lower.includes('cartão') || lower.includes('banco')) {
    return `Métodos de Pagamento Aceites em Moçambique:\n\n` +
      `• M-Pesa (Vodacom): Pagamento instantâneo via telemóvel\n` +
      `• E-Mola (Movitel): Rápido e prático\n` +
      `• Cartões Visa e Mastercard (via ScalePay)\n` +
      `• Transferência Bancária (BCI, Standard Bank, Millennium BIM)\n\n` +
      `O seu serviço é provisionado automaticamente assim que o pagamento for confirmado.\n` +
      `Para testar ou efetuar pagamentos: [/test-payment](/test-payment)`;
  }

  // Suporte e Meus Serviços (se o cliente tiver dados)
  if (clientData && (lower.includes('meu pedido') || lower.includes('meu serviço') || lower.includes('meu ticket') || lower.includes('minha conta'))) {
    const ordersText = clientData.orders?.length > 0 
      ? clientData.orders.map((o: any, idx: number) => `${idx + 1}. ${o.serviceName} (${o.amount?.toLocaleString('pt-MZ')} MZN) — Estado: ${o.status}`).join('\n')
      : 'Nenhum pedido recente registado.';
    
    return `Os Seus Serviços na WEHOSTHERE:\n\nÚltimos Pedidos:\n${ordersText}\n\nAceda ao painel completo em: [/dashboard](/dashboard) ou abra um ticket de suporte em [/dashboard/tickets](/dashboard/tickets)`;
  }

  // Resposta Geral de Atendimento ao Cliente
  return `Olá! Sou o WEHOSTHERE AI Copilot, o seu assistente inteligente.\n\n` +
    `Como posso ajudá-lo hoje?\n` +
    `• Consultar planos de hospedagem e preços: [/hospedagem](/hospedagem)\n` +
    `• Registar um domínio .co.mz ou .com: [/dominios](/dominios)\n` +
    `• Pedir orçamento para criar um site: [/site-quote](/site-quote)\n` +
    `• Configuração de email profissional: [/email-profissional](/email-profissional)\n` +
    `• Abrir um chamado de suporte: [/dashboard/tickets](/dashboard/tickets)\n\n` +
    `Digite a sua dúvida ou selecione uma das opções acima!`;
}
