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
      analytics: { visitsToday: 0, uniqueVisitors: 0 }
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
Você é o **WEHOSTHERE AI Copilot**, o assistente executivo e de inteligência operacional de elite do painel de administração da WEHOSTHERE.

Você tem acesso direto aos dados e endpoints em tempo real do banco de dados MongoDB da plataforma:

📊 DADOS ATUAIS EM TEMPO REAL NO BANCO DE DADOS:
- 👥 UTILIZADORES:
  * Total de Utilizadores: ${liveData.users.total}
  * Ativos: ${liveData.users.active} | Pendentes de Confirmação: ${liveData.users.pending}
  * Últimos 5 Utilizadores Registados: ${JSON.stringify(liveData.users.recent)}

- 🛒 PEDIDOS & VENDAS:
  * Total de Pedidos: ${liveData.orders.total} (Concluídos: ${liveData.orders.completed}, Pendentes: ${liveData.orders.pending})
  * Últimos Pedidos: ${JSON.stringify(liveData.orders.recent)}

- 💰 FATURAÇÃO & PAGAMENTOS MENSAIS:
  * Faturas com Pagamento Pendente/Atrasado: ${liveData.payments.pendingCount}
  * Clientes com Faturas Pendentes: ${JSON.stringify(liveData.payments.overdueList)}

- 🎫 SUPORTE & TICKETS:
  * Total de Tickets: ${liveData.tickets.total}
  * Tickets em Aberto / Aguardando Resposta: ${liveData.tickets.open}
  * Lista de Tickets Abertos: ${JSON.stringify(liveData.tickets.recent)}

- 🌐 SITES & DOMÍNIOS:
  * Sites Ativos Criados: ${liveData.sites.total}
  * Domínios de Email Corporativo: ${liveData.domains.total} (Detalhes: ${JSON.stringify(liveData.domains.list)})

- 🤝 AFILIADOS & MARKETING:
  * Total de Afiliados: ${liveData.affiliates.total}
  * Comissões Pendentes de Saque: ${liveData.affiliates.pendingCommissions} (Total: ${liveData.affiliates.pendingAmount} MZN)
  * Assinantes da Newsletter: ${liveData.newsletter.totalSubscribers}
  * Carrinhos Abandonados: ${liveData.abandonedCarts.count}
  * Total de Visitas Registadas: ${liveData.analytics.totalVisits}

${WEHOSTHERE_KNOWLEDGE}

DIRETRIZES DE RESPOSTA:
1. Use SEMPRE os dados reais e exatos fornecidos acima quando o administrador perguntar sobre utilizadores, faturas, vendas, tickets, domínios ou métricas.
2. Responda em Português de forma profissional, elegante, clara e direta com formatação Markdown (tabelas, listas, negrito).
3. Quando sugerir uma ação ou módulo, inclua o link clicável correspondente (ex: "/admin/pagamentos-mensais", "/admin/comunicacao", "/admin/email-domains", "/admin/affiliates").
4. Se o administrador pedir para redigir um email, proposta ou resposta de ticket, entregue o texto pronto para envio.
`;

    // 1. Tentar Google Gemini se a chave existir
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const contents = [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...history.map((h: any) => ({
            role: h.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: h.content }]
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
            return NextResponse.json({ success: true, answer: reply, provider: 'gemini' });
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
              ...history.map((h: any) => ({ role: h.role, content: h.content })),
              { role: 'user', content: cleanQuery }
            ],
            temperature: 0.7,
          }),
        });

        if (openaiRes.ok) {
          const data = await openaiRes.json();
          const reply = data?.choices?.[0]?.message?.content;
          if (reply) {
            return NextResponse.json({ success: true, answer: reply, provider: 'openai' });
          }
        }
      } catch (err) {
        console.warn('[AI Copilot] OpenAI API Error:', err);
      }
    }

    // 3. Motor Inteligente Nativo da WEHOSTHERE com todos os dados vivos
    const smartLocalAnswer = generateEnrichedLocalResponse(cleanQuery, liveData);
    return NextResponse.json({ success: true, answer: smartLocalAnswer, provider: 'local-engine-v2' });

  } catch (error) {
    console.error('[AI Copilot] Erro no processamento:', error);
    return NextResponse.json({ error: 'Ocorreu um erro ao processar o seu comando' }, { status: 500 });
  }
}

// Resposta inteligente local nativa baseada na análise profunda dos dados do banco
function generateEnrichedLocalResponse(query: string, data: any): string {
  const lower = query.toLowerCase();

  // Últimos utilizadores ou lista de clientes
  if (lower.includes('último') || lower.includes('recent') || lower.includes('quem se cadastrou') || (lower.includes('utilizador') && lower.includes('cadastr'))) {
    if (data.users.recent && data.users.recent.length > 0) {
      const list = data.users.recent.map((u: any, idx: number) => 
        `${idx + 1}. **${u.name || 'Sem nome'}** (${u.email}) — Plano: \`${u.plan || 'none'}\` | Status: *${u.status}*`
      ).join('\n');
      return `👥 **Últimos Utilizadores Registados no Banco de Dados:**\n\n${list}\n\n- **Total de Contas:** ${data.users.total} (${data.users.active} ativas, ${data.users.pending} pendentes)\n\n👉 Gerir utilizadores em: [/admin](/admin).`;
    }
    return `👥 **Total de Utilizadores:** ${data.users.total} cadastrados (${data.users.active} ativos).\n👉 Veja a lista completa no painel de [/admin](/admin).`;
  }

  // Pedidos e Vendas
  if (lower.includes('pedido') || lower.includes('venda') || lower.includes('compra')) {
    if (data.orders.recent && data.orders.recent.length > 0) {
      const list = data.orders.recent.map((o: any, idx: number) =>
        `${idx + 1}. **${o.clientName || o.clientEmail}** — ${o.serviceName} | **${o.amount?.toLocaleString('pt-MZ')} MZN** (${o.paymentMethod}) — Status: *${o.status}*`
      ).join('\n');
      return `🛒 **Relatório de Pedidos & Vendas:**\n\n- **Total de Pedidos:** ${data.orders.total}\n- **Concluídos:** ${data.orders.completed} | **Pendentes:** ${data.orders.pending}\n\n**Últimos Pedidos:**\n${list}\n\n👉 Acompanhe notificações de vendas em [/admin/notifications](/admin/notifications).`;
    }
    return `🛒 **Total de Pedidos Registados:** ${data.orders.total} (${data.orders.completed} concluídos).`;
  }

  // Pagamentos, faturas, devedores
  if (lower.includes('fatura') || lower.includes('pagamento') || lower.includes('devedor') || lower.includes('m-pesa') || lower.includes('atras')) {
    if (data.payments.overdueList && data.payments.overdueList.length > 0) {
      const list = data.payments.overdueList.map((p: any, idx: number) =>
        `${idx + 1}. **${p.clientName || p.clientEmail}** — ${p.remainingAmount || p.amount} MZN (Mês ${p.month}/${p.year}) — *${p.status}*`
      ).join('\n');
      return `💰 **Faturas com Ação Pendente (${data.payments.pendingCount}):**\n\n${list}\n\n👉 Gerir cobranças e lançar pagamentos em: [/admin/pagamentos-mensais](/admin/pagamentos-mensais).`;
    }
    return `💰 **Finanças:** Não existem faturas em atraso no momento. Todas as mensalidades estão em dia!\n👉 Ver balanço em: [/admin/pagamentos-mensais](/admin/pagamentos-mensais).`;
  }

  // Suporte e Tickets
  if (lower.includes('ticket') || lower.includes('suporte') || lower.includes('atendimento') || lower.includes('chamado')) {
    if (data.tickets.recent && data.tickets.recent.length > 0) {
      const list = data.tickets.recent.map((t: any, idx: number) =>
        `${idx + 1}. **[${t.priority?.toUpperCase() || 'MÉDIA'}]** ${t.subject} — *${t.userName}* (${t.userEmail})`
      ).join('\n');
      return `🎫 **Tickets de Suporte em Aberto (${data.tickets.open}):**\n\n${list}\n\n👉 Responder aos clientes no painel de tickets.`;
    }
    return `🎫 **Suporte:** Não há tickets pendentes de resposta no momento. Todos os chamados foram respondidos!`;
  }

  // Afiliados e Comissões
  if (lower.includes('afiliado') || lower.includes('comiss')) {
    return `🤝 **Programa de Afiliados:**\n\n- **Total de Afiliados Registados:** ${data.affiliates.total}\n- **Comissões Pendentes de Saque:** ${data.affiliates.pendingCommissions} (Total: **${data.affiliates.pendingAmount?.toLocaleString('pt-MZ') || 0} MZN**)\n\n👉 Gerir saques e aprovar comissões em: [/admin/affiliates](/admin/affiliates).`;
  }

  // Newsletter e Marketing
  if (lower.includes('newsletter') || lower.includes('subscritor') || lower.includes('assinante')) {
    return `📢 **Marketing & Newsletter:**\n\n- **Total de Assinantes:** ${data.newsletter.totalSubscribers}\n- **Carrinhos Abandonados:** ${data.abandonedCarts.count}\n\n👉 Enviar newsletter ou comunicado em massa em: [/admin/comunicacao](/admin/comunicacao).`;
  }

  // Emails e Domínios
  if (lower.includes('email') || lower.includes('domínio') || lower.includes('migadu') || lower.includes('dns')) {
    return `📧 **Infraestrutura de Email & Domínios:**\n\n- **Domínios Configurados:** ${data.domains.total}\n\n**Registos DNS Oficiais:**\n- **MX 1:** \`aspmx.migadu.com\` (Prioridade 10)\n- **MX 2:** \`aspmx2.migadu.com\` (Prioridade 20)\n- **SPF:** \`v=spf1 include:spf.migadu.com ~all\`\n\n👉 Gerir domínios e caixas de correio em: [/admin/email-domains](/admin/email-domains).`;
  }

  // Resposta Geral de Visão Global
  return `🤖 **WEHOSTHERE AI Copilot — Visão Geral do Sistema:**\n\n` +
    `• 👥 **Utilizadores:** ${data.users.total} (${data.users.active} ativos)\n` +
    `• 🛒 **Pedidos:** ${data.orders.total} (${data.orders.completed} concluídos)\n` +
    `• 💰 **Faturas Pendentes:** ${data.payments.pendingCount}\n` +
    `• 🎫 **Tickets Abertos:** ${data.tickets.open}\n` +
    `• 🌐 **Sites Ativos:** ${data.sites.total} | **Domínios:** ${data.domains.total}\n` +
    `• 📢 **Assinantes Newsletter:** ${data.newsletter.totalSubscribers}\n\n` +
    `Como posso ajudar especificamente agora? Pode pedir relatórios detalhados, listas de clientes, ajuda com DNS ou redação de mensagens!`;
}
