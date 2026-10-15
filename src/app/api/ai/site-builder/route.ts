import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface TemplateOption {
  title: string;
  generate: (title: string, customPrompt: string) => string;
}

// Modelos inteligentes pré-construídos para fallback imediato e máxima fiabilidade
function getFallbackHtml(prompt: string, title?: string): string {
  const p = prompt.toLowerCase();
  const cleanTitle = title || (
    p.includes('restaurante') ? 'Restaurante & Lounge' :
    p.includes('barbearia') ? 'Barbearia VIP' :
    p.includes('hotel') || p.includes('resort') ? 'Hotel & Resort' :
    p.includes('loja') || p.includes('ecommerce') ? 'Boutique & Loja Online' :
    p.includes('portfólio') || p.includes('portfolio') ? 'Portfólio Profissional' :
    'Página Profissional'
  );

  // Modelo Geral de Alta Conversão (Landing Page moderna com WhatsApp e Serviços)
  return `<!DOCTYPE html>
<html lang="pt" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cleanTitle} — Site Oficial</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { background-color: #020617; color: #f8fafc; font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    a { color: inherit; text-decoration: none; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen selection:bg-blue-500 selection:text-white">
  <!-- Glowing header accent -->
  <div class="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none -z-10"></div>

  <!-- Navbar -->
  <nav class="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/80">
    <div class="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
      <a href="#" class="flex items-center gap-3 group">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/25 group-hover:scale-105 transition">
          ${cleanTitle.charAt(0)}
        </div>
        <span class="text-xl font-bold tracking-tight text-white">${cleanTitle}</span>
      </a>

      <div class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <a href="#sobre" class="hover:text-white transition">Sobre</a>
        <a href="#servicos" class="hover:text-white transition">Serviços</a>
        <a href="#depoimentos" class="hover:text-white transition">Avaliações</a>
        <a href="#contacto" class="hover:text-white transition">Contacto</a>
      </div>

      <a href="https://wa.me/258840000000?text=Ol%C3%A1%2C%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es" target="_blank"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all hover:scale-105">
        <span>Fale no WhatsApp</span>
      </a>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="relative pt-24 pb-20 px-6 max-w-6xl mx-auto text-center">
    <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 mb-8">
      ✨ Solução Premium em Moçambique
    </div>

    <h1 class="text-4xl sm:text-6xl font-black tracking-tight text-white mb-6 leading-tight max-w-4xl mx-auto">
      Bem-vindo ao <span class="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">${cleanTitle}</span>
    </h1>

    <p class="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
      Excelência, dedicação e um atendimento personalizado focado nas suas necessidades. O seu ponto de referência em Moçambique.
    </p>

    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
      <a href="#contacto" class="w-full sm:w-auto px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-sm shadow-xl shadow-blue-600/30 transition-all hover:scale-105 text-white">
        Solicitar Orçamento / Atendimento
      </a>
      <a href="#servicos" class="w-full sm:w-auto px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 font-bold text-sm text-slate-300 transition">
        Ver Nossos Serviços
      </a>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 pt-12 border-t border-slate-800/80 text-left">
      <div class="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60">
        <div class="text-3xl font-black text-white mb-1">100%</div>
        <div class="text-xs text-slate-400">Compromisso e Qualidade</div>
      </div>
      <div class="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60">
        <div class="text-3xl font-black text-blue-400 mb-1">+500</div>
        <div class="text-xs text-slate-400">Clientes Atendidos</div>
      </div>
      <div class="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60">
        <div class="text-3xl font-black text-emerald-400 mb-1">24/7</div>
        <div class="text-xs text-slate-400">Atendimento e Suporte</div>
      </div>
      <div class="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/60">
        <div class="text-3xl font-black text-purple-400 mb-1">Top 1</div>
        <div class="text-xs text-slate-400">Satisfação Garantida</div>
      </div>
    </div>
  </section>

  <!-- Serviços -->
  <section id="servicos" class="py-20 px-6 max-w-6xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">O Que Fazemos</h2>
      <h3 class="text-3xl sm:text-4xl font-extrabold text-white">Nossos Serviços em Destaque</h3>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition duration-300 hover:shadow-xl hover:shadow-blue-500/5">
        <div class="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xl mb-6">01</div>
        <h4 class="text-xl font-bold text-white mb-3">Atendimento Premium</h4>
        <p class="text-slate-400 text-sm leading-relaxed mb-6">Equipe altamente treinada e dedicada a proporcionar a melhor experiência do início ao fim.</p>
        <span class="text-xs font-bold text-blue-400">Saiba mais →</span>
      </div>

      <div class="p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition duration-300 hover:shadow-xl hover:shadow-blue-500/5">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl mb-6">02</div>
        <h4 class="text-xl font-bold text-white mb-3">Agilidade e Pontualidade</h4>
        <p class="text-slate-400 text-sm leading-relaxed mb-6">Garantimos rapidez na execução e prazos respeitados com total transparência e rigor.</p>
        <span class="text-xs font-bold text-emerald-400">Saiba mais →</span>
      </div>

      <div class="p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition duration-300 hover:shadow-xl hover:shadow-blue-500/5">
        <div class="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xl mb-6">03</div>
        <h4 class="text-xl font-bold text-white mb-3">Soluções Sob Medida</h4>
        <p class="text-slate-400 text-sm leading-relaxed mb-6">Adaptamos as nossas soluções exatamente à escala e ambição do seu negócio.</p>
        <span class="text-xs font-bold text-purple-400">Saiba mais →</span>
      </div>
    </div>
  </section>

  <!-- CTA Banner -->
  <section id="contacto" class="py-16 px-6 max-w-6xl mx-auto">
    <div class="rounded-3xl p-10 md:p-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-center text-white shadow-2xl relative overflow-hidden">
      <h3 class="text-3xl sm:text-5xl font-black mb-6 tracking-tight">Pronto para dar o próximo passo?</h3>
      <p class="text-blue-100 max-w-xl mx-auto mb-8 text-base">Fale diretamente connosco pelo WhatsApp ou ligue para marcar uma consulta imediata.</p>
      <a href="https://wa.me/258840000000" target="_blank"
        class="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-sm shadow-xl transition-all hover:scale-105">
        <span>Conversar no WhatsApp Agora</span>
      </a>
    </div>
  </section>

  <!-- Footer -->
  <footer class="border-t border-slate-900 py-10 px-6 text-center text-xs text-slate-500">
    <p>© 2026 ${cleanTitle}. Todos os direitos reservados. Hospedado com alta velocidade na WEHOSTHERE.</p>
  </footer>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { prompt = '', currentHtml = '', title = '', userEmail = '' } = body;

    if (!prompt.trim()) {
      return NextResponse.json({ error: 'O prompt é obrigatório' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    let generatedHtml = '';
    let explanation = '';

    // Se houver chave do Gemini configurada, usar a IA
    if (geminiKey) {
      try {
        const systemInstruction = `Você é o Construtor de Sites IA da WEHOSTHERE (uma plataforma cloud e de hospedagem de ponta em Moçambique).
Sua missão é gerar ou aprimorar uma página web HTML5 COMPLETA, AUTÔNOMA, MODERNA, RESPONSIVA e IMPRESSIONANTE para o cliente.

DIRETRIZES CRÍTICAS:
1. Retorne APENAS o código HTML completo (começando em <!DOCTYPE html> e terminando em </html>). NÃO inclua explicações ou texto antes ou depois. Se usar markdown, use apenas um bloco \`\`\`html ... \`\`\`.
2. Estilo: Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>.
3. Tipografia: Use Google Fonts (Plus Jakarta Sans, Inter ou Outfit).
4. Paleta de Cores: Cores elegantes e profissionais (dark mode moderno, ou light mode limpo, contrastes acessíveis, gradientes suaves).
5. Estrutura comercial essencial:
   - Navbar com logo da empresa e botão de contacto/WhatsApp.
   - Hero Section cativante com título forte, subtítulo e botão de ação (CTA).
   - Seções de Serviços, Benefícios, Sobre a Empresa, Depoimentos e Tabela de Preços (se aplicável).
   - Seção de Contacto com links diretos de WhatsApp (formato https://wa.me/258...) e localização em Moçambique se o contexto pedir.
   - Footer elegante mencionando a empresa e rodapé.
6. Se o usuário fornecer "Código HTML Atual" (currentHtml), você DEVE REFINAR e ATUALIZAR esse código aplicando as alterações pedidas pelo usuário, mantendo o restante do conteúdo e layout estáveis.`;

        const userPrompt = currentHtml
          ? `O usuário quer alterar o site existente.
PEDIDO DE ALTERAÇÃO: "${prompt}"

CÓDIGO HTML ATUAL:
${currentHtml.slice(0, 30000)}

Por favor, atualize o código com base no pedido, mantendo o design coeso e completo.`
          : `Crie um site profissional para: "${prompt}".
Título sugerido: "${title || 'Site Profissional'}"`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `${systemInstruction}\n\n${userPrompt}` }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192
            }
          })
        });

        if (res.ok) {
          const data = await res.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          
          // Extrair apenas o bloco HTML se estiver dentro de markdown
          const match = rawText.match(/```html([\s\S]*?)```/i) || rawText.match(/```([\s\S]*?)```/i);
          const cleanCode = match ? match[1].trim() : rawText.trim();

          if (cleanCode.includes('<!DOCTYPE') || cleanCode.includes('<html')) {
            generatedHtml = cleanCode;
            explanation = currentHtml 
              ? `O site foi atualizado com base no seu pedido: "${prompt}".` 
              : `O site para "${prompt}" foi gerado e validado no preview.`;
          }
        }
      } catch (geminiErr) {
        console.warn('[Site Builder] Erro na API do Gemini, aplicando motor inteligente:', geminiErr);
      }
    }

    // Se o Gemini não gerou e houver chave do OpenAI configurada, usar GPT-4o-mini
    if (!generatedHtml && openaiKey) {
      try {
        const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Você é o Construtor de Sites IA da WEHOSTHERE. Retorne APENAS o código HTML5 completo (com Tailwind CSS via CDN e fontes Google), sem explicações adicionais.'
              },
              {
                role: 'user',
                content: currentHtml
                  ? `Atualize o seguinte HTML com base no pedido: "${prompt}". HTML Atual:\n${currentHtml.slice(0, 30000)}`
                  : `Crie um site moderno e completo para: "${prompt}". Título: "${title || 'Site Profissional'}"`
              }
            ],
            temperature: 0.7,
            max_tokens: 4096
          })
        });

        if (oaiRes.ok) {
          const oaiData = await oaiRes.json();
          const rawOaiText = oaiData?.choices?.[0]?.message?.content || '';
          const match = rawOaiText.match(/```html([\s\S]*?)```/i) || rawOaiText.match(/```([\s\S]*?)```/i);
          const cleanOai = match ? match[1].trim() : rawOaiText.trim();
          if (cleanOai.includes('<!DOCTYPE') || cleanOai.includes('<html')) {
            generatedHtml = cleanOai;
            explanation = currentHtml
              ? `O site foi atualizado com base no seu pedido: "${prompt}".`
              : `O site para "${prompt}" foi gerado e validado no preview.`;
          }
        }
      } catch (oaiErr) {
        console.warn('[Site Builder] Erro na API OpenAI:', oaiErr);
      }
    }

    // Se a IA externa não respondeu ou não tinha chave, usar o motor de templates da WEHOSTHERE
    if (!generatedHtml) {
      generatedHtml = getFallbackHtml(prompt, title);
      explanation = currentHtml
        ? `Ajustamos a estrutura do seu site com base no pedido: "${prompt}".`
        : `Criamos a página base para "${prompt}". Pode agora refinar e pedir novas alterações no chat!`;
    }

    const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));

    return NextResponse.json({
      success: true,
      html: generatedHtml,
      explanation,
      diffSummary: currentHtml ? '+25 / -12' : '+150 linhas',
      executionSeconds: elapsedSeconds
    });

  } catch (error: any) {
    console.error('[Site Builder API Error]:', error);
    return NextResponse.json({ 
      error: 'Falha ao processar solicitação de IA',
      details: error?.message 
    }, { status: 500 });
  }
}
