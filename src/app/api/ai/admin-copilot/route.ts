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

// Base de conhecimento conceitual sobre a WEHOSTHERE
const WEHOSTHERE_KNOWLEDGE = `
Sobre a WEHOSTHERE:
- Plataforma líder de Hospedagem de Sites, Email Profissional, Registro de Domínios e Infraestruturas Cloud em Moçambique.
- Moeda padrão: Metical (MZN).
- Suporte e Contato Oficial: info@wehosthere.com, Tel/WhatsApp: +258 84 438 4702.
- Planos de Hospedagem:
  * Plano Básico (550 MT/mês): 10GB SSD, 100GB Tráfego, 2GB RAM, 5 Contas de Email.
  * Plano Profissional (1.200 MT/mês): 30GB SSD, Tráfego Ilimitado, 4GB RAM, Contas de Email Ilimitadas.
  * Plano Enterprise / VPS (3.500 MT/mês): 100GB NVMe SSD, Recursos Dedicados, 8GB RAM, Suporte VIP 24/7.
- Gestão de Email: Provedor Migadu integrado com Webmail completo, IMAP/SMTP, MX records (aspmx.migadu.com / aspmx2.migadu.com), SPF (v=spf1 include:spf.migadu.com ~all), DKIM e DMARC.
- Métodos de Pagamento: M-Pesa, Cartões Visa/Mastercard (ScalePay), Transferência Bancária (BCI, Standard Bank, Millennium BIM) e Dinheiro.
- Estrutura de Navegação:
  * /admin : Dashboard geral, métricas em tempo real e utilizadores.
  * /admin/pagamentos-mensais : Controlo financeiro, faturas e clientes devedores.
  * /admin/comunicacao : Envio de emails individuais, em massa e newsletter.
  * /admin/partners : Gestão de parceiros exibidos no site.
  * /admin/email-domains : Domínios de email corporativo e diagnósticos DNS.
  * /admin/affiliates : Programa de afiliados, comissões e pedidos de saque.
  * /admin/academy : Cursos, módulos e aulas da Academia WEHOSTHERE.
  * /admin/blog : Artigos, notícias e publicações.
  * /admin/settings : Configurações do sistema, notificações push e integrações.
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query = '', history = [] } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Comando ou pergunta é obrigatório' }, { status: 400 });
    }

    const cleanQuery = query.trim();

    // 1. Obter todos os dados em tempo real do MongoDB
    let liveData: any = {
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
        usersTotal,
        usersActive,
        usersPending,
        recentUsers,
        ordersTotal,
        ordersCompleted,
        ordersPending,
        recentOrders,
        pendingPayments,
        ticketsTotal,
        ticketsOpen,
        recentTickets,
        sitesTotal,
        domainsList,
        affiliatesTotal,
        pendingCommissions,
        newsletterCount,
        abandonedCartsCount,
        visitsCount
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

      liveData.users = {
        total: usersTotal,
        active: usersActive,
        pending: usersPending,
        recent: recentUsers,
      };

      liveData.orders = {
        total: ordersTotal,
        completed: ordersCompleted,
        pending: ordersPending,
        recent: recentOrders,
      };

      liveData.payments = {
        pendingCount: pendingPayments.length,
        overdueList: pendingPayments,
      };

      liveData.tickets = {
        total: ticketsTotal,
        open: ticketsOpen,
        recent: recentTickets,
      };

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
      console.warn('[AI Copilot] Erro ao consultar MongoDB para contexto:', dbErr);
    }

    // Montar o Prompt do Sistema com TODOS os dados reais do MongoDB
    const systemPrompt = `
Você é o WEHOSTHERE AI Copilot, assistente executivo e operacional de elite do painel de administração da WEHOSTHERE.

Você tem acesso direto aos dados e endpoints em tempo real do banco de dados MongoDB da plataforma:

DADOS ATUAIS EM TEMPO REAL NO BANCO DE DADOS:
- UTILIZADORES: Total: ${liveData.users.total} | Ativos: ${liveData.users.active} | Pendentes: ${liveData.users.pending} | Recentes: ${JSON.stringify(liveData.users.recent)}
- PEDIDOS: Total: ${liveData.orders.total} | Concluídos: ${liveData.orders.completed} | Pendentes: ${liveData.orders.pending} | Recentes: ${JSON.stringify(liveData.orders.recent)}
- FATURAÇÃO & PAGAMENTOS: Faturas Pendentes: ${liveData.payments.pendingCount} | Lista: ${JSON.stringify(liveData.payments.overdueList)}
- SUPORTE & TICKETS: Total: ${liveData.tickets.total} | Abertos: ${liveData.tickets.open} | Lista: ${JSON.stringify(liveData.tickets.recent)}
- SITES & DOMÍNIOS: Sites Ativos: ${liveData.sites.total} | Domínios: ${liveData.domains.total} (Detalhes: ${JSON.stringify(liveData.domains.list)})
- AFILIADOS: Total: ${liveData.affiliates.total} | Comissões Pendentes: ${liveData.affiliates.pendingCommissions} (${liveData.affiliates.pendingAmount} MZN)
- MARKETING: Newsletter: ${liveData.newsletter.totalSubscribers} assinantes | Carrinhos Abandonados: ${liveData.abandonedCarts.count} | Visitas: ${liveData.analytics.totalVisits}

${WEHOSTHERE_KNOWLEDGE}

REGRAS DE FORMATAÇÃO E RESPOSTA:
1. IMPORTANTE: NUNCA USE ASTERISCOS (**) OU (*) PARA NEGRITO OU ITÁLICO. O texto deve ser 100% limpo, sem caracteres de formatação crua.
2. NUNCA USE EMOJIS AMADORES OU INFANTIS (como 🤖, 👥, 🛒, 💰, 🎫, 🌐, 📢, 👉). Mantenha uma linguagem executiva, sóbria, elegante e profissional de nível empresarial.
3. Use listas com marcadores simples e limpos (•) e quebras de linha organizadas.
4. Quando sugerir uma página do sistema, inclua o link clicável (ex: /admin/pagamentos-mensais ou /admin/comunicacao).
5. Responda em Português de forma profissional, direta e executiva.
`;

    // 1. Tentar Google Gemini se a chave existir
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

    // 2. Tentar OpenAI se a chave existir
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

    // 3. Motor Inteligente Nativo da WEHOSTHERE com todos os dados vivos (Sem asteriscos e sem emojis amadores)
    const smartLocalAnswer = generateEnrichedCleanLocalResponse(cleanQuery, liveData);
    return NextResponse.json({ success: true, answer: smartLocalAnswer, provider: 'local-engine-v2' });

  } catch (error) {
    console.error('[AI Copilot] Erro no processamento:', error);
    return NextResponse.json({ error: 'Ocorreu um erro ao processar o seu comando' }, { status: 500 });
  }
}

// Resposta inteligente local profissional e limpa (Sem asteriscos e sem emojis amadores)
function generateEnrichedCleanLocalResponse(query: string, data: any): string {
  const lower = query.toLowerCase();

  // Últimos utilizadores ou lista de clientes
  if (lower.includes('último') || lower.includes('recent') || lower.includes('quem se cadastrou') || (lower.includes('utilizador') && lower.includes('cadastr'))) {
    if (data.users.recent && data.users.recent.length > 0) {
      const list = data.users.recent.map((u: any, idx: number) => 
        `${idx + 1}. ${u.name || 'Sem nome'} (${u.email}) — Plano: ${u.plan || 'Nenhum'} | Estado: ${u.status === 'active' ? 'Ativo' : 'Pendente'}`
      ).join('\n');
      return `Utilizadores Registados Recentemente:\n\n${list}\n\n• Total de Contas: ${data.users.total} (${data.users.active} ativas, ${data.users.pending} pendentes)\n\nGerir utilizadores em: [/admin](/admin)`;
    }
    return `Total de Utilizadores: ${data.users.total} registados (${data.users.active} ativos).\nConsulte a lista completa em [/admin](/admin)`;
  }

  // Pedidos e Vendas
  if (lower.includes('pedido') || lower.includes('venda') || lower.includes('compra')) {
    if (data.orders.recent && data.orders.recent.length > 0) {
      const list = data.orders.recent.map((o: any, idx: number) =>
        `${idx + 1}. ${o.clientName || o.clientEmail} — ${o.serviceName} | ${o.amount?.toLocaleString('pt-MZ')} MZN (${o.paymentMethod}) — Estado: ${o.status}`
      ).join('\n');
      return `Relatório de Pedidos & Vendas:\n\n• Total de Pedidos: ${data.orders.total}\n• Concluídos: ${data.orders.completed} | Pendentes: ${data.orders.pending}\n\nÚltimos Pedidos:\n${list}\n\nAcompanhar vendas em [/admin/notifications](/admin/notifications)`;
    }
    return `Total de Pedidos Registados: ${data.orders.total} (${data.orders.completed} concluídos).`;
  }

  // Pagamentos, faturas, devedores
  if (lower.includes('fatura') || lower.includes('pagamento') || lower.includes('devedor') || lower.includes('m-pesa') || lower.includes('atras')) {
    if (data.payments.overdueList && data.payments.overdueList.length > 0) {
      const list = data.payments.overdueList.map((p: any, idx: number) =>
        `${idx + 1}. ${p.clientName || p.clientEmail} — ${p.remainingAmount || p.amount} MZN (Mês ${p.month}/${p.year}) — Estado: ${p.status}`
      ).join('\n');
      return `Faturas com Ação Pendente (${data.payments.pendingCount}):\n\n${list}\n\nGerir cobranças e lançar pagamentos em: [/admin/pagamentos-mensais](/admin/pagamentos-mensais)`;
    }
    return `Finanças: Não existem faturas em atraso no momento. Todas as mensalidades estão em dia.\nVer balanço em: [/admin/pagamentos-mensais](/admin/pagamentos-mensais)`;
  }

  // Suporte e Tickets
  if (lower.includes('ticket') || lower.includes('suporte') || lower.includes('atendimento') || lower.includes('chamado')) {
    if (data.tickets.recent && data.tickets.recent.length > 0) {
      const list = data.tickets.recent.map((t: any, idx: number) =>
        `${idx + 1}. [${t.priority?.toUpperCase() || 'MÉDIA'}] ${t.subject} — ${t.userName} (${t.userEmail})`
      ).join('\n');
      return `Tickets de Suporte em Aberto (${data.tickets.open}):\n\n${list}\n\nResponder aos clientes no painel de tickets.`;
    }
    return `Suporte: Não há tickets pendentes de resposta no momento. Todos os chamados foram respondidos.`;
  }

  // Afiliados e Comissões
  if (lower.includes('afiliado') || lower.includes('comiss')) {
    return `Programa de Afiliados:\n\n• Total de Afiliados: ${data.affiliates.total}\n• Comissões Pendentes de Saque: ${data.affiliates.pendingCommissions} (Total: ${data.affiliates.pendingAmount?.toLocaleString('pt-MZ') || 0} MZN)\n\nGerir saques e aprovar comissões em: [/admin/affiliates](/admin/affiliates)`;
  }

  // Newsletter e Marketing
  if (lower.includes('newsletter') || lower.includes('subscritor') || lower.includes('assinante')) {
    return `Marketing & Newsletter:\n\n• Total de Assinantes: ${data.newsletter.totalSubscribers}\n• Carrinhos Abandonados: ${data.abandonedCarts.count}\n\nEnviar newsletter ou comunicado em massa em: [/admin/comunicacao](/admin/comunicacao)`;
  }

  // Emails e Domínios
  if (lower.includes('email') || lower.includes('domínio') || lower.includes('migadu') || lower.includes('dns')) {
    return `Infraestrutura de Email & Domínios:\n\n• Domínios Configurados: ${data.domains.total}\n\nRegistos DNS Oficiais:\n• MX 1: aspmx.migadu.com (Prioridade 10)\n• MX 2: aspmx2.migadu.com (Prioridade 20)\n• SPF: v=spf1 include:spf.migadu.com ~all\n\nGerir domínios e caixas de correio em: [/admin/email-domains](/admin/email-domains)`;
  }

  // Resposta Geral de Visão Global
  return `WEHOSTHERE AI Copilot — Visão Geral do Sistema:\n\n` +
    `• Utilizadores: ${data.users.total} (${data.users.active} ativos)\n` +
    `• Pedidos: ${data.orders.total} (${data.orders.completed} concluídos)\n` +
    `• Faturas Pendentes: ${data.payments.pendingCount}\n` +
    `• Tickets Abertos: ${data.tickets.open}\n` +
    `• Sites Ativos: ${data.sites.total} | Domínios: ${data.domains.total}\n` +
    `• Assinantes Newsletter: ${data.newsletter.totalSubscribers}\n\n` +
    `Como posso ajudar com a operação da plataforma? Pode solicitar relatórios detalhados, listas de clientes, ajuda com DNS ou redação de comunicados.`;
}
