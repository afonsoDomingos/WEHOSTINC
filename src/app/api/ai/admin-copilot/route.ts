import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';
import MonthlyPaymentModel from '@/lib/models/MonthlyPayment';
import { EmailDomain } from '@/models/EmailDomain';

// Base de conhecimento local e estruturada sobre o ecossistema WEHOSTHERE
const WEHOSTHERE_KNOWLEDGE = `
Sobre a WEHOSTHERE:
- Plataforma líder de Hospedagem de Sites, Email Profissional, Registro de Domínios e Infraestruturas Cloud em Moçambique.
- Moeda padrão: Metical (MZN).
- Suporte e Contato: info@wehosthere.com, Tel/WhatsApp: +258 84 438 4702.
- Planos de Hospedagem:
  * Plano Básico (550 MT/mês): 10GB SSD, 100GB Tráfego, 2GB RAM, 5 Contas de Email.
  * Plano Profissional (1.200 MT/mês): 30GB SSD, Tráfego Ilimitado, 4GB RAM, Contas de Email Ilimitadas.
  * Plano Enterprise / VPS (3.500 MT/mês): 100GB NVMe SSD, Recursos Dedicados, 8GB RAM, Suporte VIP 24/7.
- Gestão de Email: Provedor Migadu integrado com suporte a Webmail (IMAP/SMTP), registos MX, SPF, DKIM e DMARC.
- Métodos de Pagamento suportados: M-Pesa, Cartão Visa/Mastercard (ScalePay / Stripe), Transferência Bancária (BCI, Standard Bank, Millennium BIM) e Pagamento em Dinheiro.
- Estrutura do Painel Administrativo:
  * /admin : Dashboard principal, métricas de tráfego em tempo real, utilizadores, servidores e logs de segurança.
  * /admin/pagamentos-mensais : Controlo de receitas, clientes devedores, pagamentos parciais e faturas.
  * /admin/comunicacao : Envio de emails em massa, templates automáticos e newsletter.
  * /admin/partners : Gestão de parceiros exibidos na página inicial.
  * /admin/email-domains : Domínios de email corporativo, caixas de correio e diagnóstico DNS.
  * /admin/affiliates : Gestão de afiliados, taxas de comissão e pedidos de saque.
  * /admin/academy : Cursos, módulos e aulas para a WEHOSTHERE Academy.
  * /admin/blog : Publicação e edição de artigos e notícias.
  * /admin/settings : Configurações do sistema, chaves de API e notificações push.
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query = '', history = [] } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Comando ou pergunta é obrigatório' }, { status: 400 });
    }

    const cleanQuery = query.trim();

    // 1. Obter contexto em tempo real do banco de dados (se disponível)
    let liveStats = {
      totalUsers: 0,
      activeUsers: 0,
      pendingPayments: 0,
      totalPaymentsAmount: 0,
      totalDomains: 0,
    };

    try {
      await connectDB();
      const [usersCount, activeUsersCount, pendingPaymentsCount, domainsCount] = await Promise.all([
        UserModel.countDocuments({}),
        UserModel.countDocuments({ status: 'active' }),
        MonthlyPaymentModel.countDocuments({ status: { $in: ['pending', 'overdue', 'partial'] } }).catch(() => 0),
        EmailDomain.countDocuments({}).catch(() => 0),
      ]);

      liveStats.totalUsers = usersCount;
      liveStats.activeUsers = activeUsersCount;
      liveStats.pendingPayments = pendingPaymentsCount;
      liveStats.totalDomains = domainsCount;
    } catch (dbErr) {
      console.warn('[AI Copilot] MongoDB stats fallback:', dbErr);
    }

    const systemPrompt = `
Você é o **WEHOSTHERE AI Copilot**, o assistente executivo e de inteligência operacional de elite integrado no painel de administração da plataforma WEHOSTHERE em Moçambique.

Seu objetivo é ajudar o Administrador a:
1. Analisar dados, métricas e finanças da plataforma.
2. Responder a dúvidas técnicas sobre DNS, hospedagem, e-mails, pagamentos M-Pesa e servidores.
3. Sugerir ações imediatas com links diretos para as páginas do painel (/admin/...).
4. Redigir respostas rápidas para clientes ou templates de suporte com tom profissional e direto.

Informações da Plataforma:
${WEHOSTHERE_KNOWLEDGE}

Dados e Estatísticas em Tempo Real:
- Total de Utilizadores Registados: ${liveStats.totalUsers}
- Utilizadores Ativos: ${liveStats.activeUsers}
- Faturas / Pagamentos Pendentes: ${liveStats.pendingPayments}
- Domínios de Email Configurados: ${liveStats.totalDomains}

Diretrizes de Resposta:
- Seja claro, conciso, profissional e prestativo.
- Responda em Português (Moçambique/Portugal).
- Use formatação Markdown (negrito, listas, destaques) para facilitar a leitura rápida.
- Quando relevante, sugira rotas de navegação clicáveis (ex: "/admin/pagamentos-mensais" ou "/admin/email-domains").
`;

    // Tentar Google Gemini se a chave existir
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

    // Tentar OpenAI se a chave existir
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

    // Resposta inteligente local (Motor Integrado da WEHOSTHERE)
    let fallbackAnswer = generateIntelligentLocalResponse(cleanQuery, liveStats);
    return NextResponse.json({ success: true, answer: fallbackAnswer, provider: 'local-engine' });

  } catch (error) {
    console.error('[AI Copilot] Erro no processamento:', error);
    return NextResponse.json({ error: 'Ocorreu um erro ao processar o seu comando' }, { status: 500 });
  }
}

// Motor de resposta contextual local caso APIs externas não estejam configuradas em dev
function generateIntelligentLocalResponse(query: string, stats: any): string {
  const lower = query.toLowerCase();

  if (lower.includes('usuário') || lower.includes('utilizador') || lower.includes('cliente')) {
    return `📊 **Status de Utilizadores no Sistema:**\n\n- **Total Registado:** ${stats.totalUsers || 'A consultar banco'}\n- **Contas Ativas:** ${stats.activeUsers || 'A consultar banco'}\n\nVocê pode gerenciar os utilizadores e permissões diretamente na [Página Principal do Admin](/admin).`;
  }

  if (lower.includes('pagamento') || lower.includes('fatura') || lower.includes('m-pesa') || lower.includes('receita') || lower.includes('devedor')) {
    return `💰 **Gestão Financeira & Pagamentos:**\n\n- **Faturas com Ação Pendente:** ${stats.pendingPayments}\n\nPara visualizar os detalhes de faturamento, pagamentos parciais e lançamentos manuais, aceda a:\n👉 [Painel de Pagamentos Mensais](/admin/pagamentos-mensais).`;
  }

  if (lower.includes('email') || lower.includes('domínio') || lower.includes('dns') || lower.includes('migadu') || lower.includes('mx') || lower.includes('dkim')) {
    return `📧 **Infraestrutura de Email & Domínios:**\n\n- **Domínios Registados:** ${stats.totalDomains}\n\n**Registos DNS recomendados:**\n- **MX:** \`aspmx.migadu.com\` (Prioridade 10) e \`aspmx2.migadu.com\` (Prioridade 20)\n- **SPF:** \`v=spf1 include:spf.migadu.com ~all\`\n- **DKIM:** Verifique a chave CNAME gerada no painel.\n\nGerir domínios e caixas de correio: 👉 [Domínios de Email](/admin/email-domains).`;
  }

  if (lower.includes('comunicação') || lower.includes('newsletter') || lower.includes('enviar email') || lower.includes('mensagem')) {
    return `📢 **Centro de Comunicação & Marketing:**\n\nVocê pode disparar emails manuais ou em massa para clientes ativos, pendentes ou assinantes da newsletter.\n👉 [Módulo de Comunicação](/admin/comunicacao).`;
  }

  if (lower.includes('afiliado') || lower.includes('comissão') || lower.includes('comissões')) {
    return `🤝 **Programa de Afiliados:**\n\nAcompanhe cliques, conversões de novos clientes e pedidos de saque.\n👉 [Gestão de Afiliados](/admin/affiliates).`;
  }

  return `🤖 **WEHOSTHERE AI Copilot:**\n\nEntendido! Estou pronto para auxiliar na administração da plataforma. Aqui estão algumas ações rápidas que pode executar:\n\n- 📊 **Consultar Métricas:** Ver estatísticas de vendas e visitantes no [Painel Geral](/admin).\n- 💰 **Finanças:** Ver [Pagamentos Mensais](/admin/pagamentos-mensais).\n- 📧 **Emails:** Configurar [Domínios & DNS](/admin/email-domains).\n- 📢 **Comunicar:** Enviar mensagens em [Comunicação](/admin/comunicacao).\n\nComo posso ajudar especificamente agora?`;
}
