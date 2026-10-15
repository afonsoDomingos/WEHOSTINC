import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ─── Fallback HTML ────────────────────────────────────────────────────────────
function getFallbackHtml(prompt: string, title?: string): string {
  const p = prompt.toLowerCase();

  const isSimple = p.includes('ola') || p.includes('olá') || p.includes('simples') ||
    p.includes('sistema') || p.includes('inicio') || p.includes('início');

  if (isSimple) {
    return `<!DOCTYPE html>
<html lang="pt" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Prontos para Criar o seu Sistema? - WEHOSTHERE</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <style>* { box-sizing: border-box; margin: 0; padding: 0; } html,body { background:#090a0f; color:#f8fafc; font-family:'Plus Jakarta Sans',sans-serif; }</style>
</head>
<body class="bg-[#090a0f] text-slate-100 min-h-screen flex flex-col justify-between relative overflow-hidden">
  <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-blue-600/25 via-indigo-600/15 to-purple-600/15 blur-[140px] pointer-events-none rounded-full"></div>
  <header class="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
    <div class="flex items-center gap-2.5">
      <img src="https://wehosthere.com/mascote-transparent.png" alt="WEHOSTHERE" class="w-9 h-9 object-contain" />
      <span class="font-extrabold text-sm text-white">WEHOSTHERE <span class="text-blue-400 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">AI CLOUD</span></span>
    </div>
    <a href="https://wa.me/258840000000" target="_blank" class="text-xs font-bold px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition">Falar Connosco</a>
  </header>
  <main class="w-full max-w-4xl mx-auto px-6 text-center my-auto py-12 relative z-10">
    <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold uppercase tracking-wider text-blue-400 mb-6">
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      Nuvem &amp; Sistemas em Mocambique
    </div>
    <h1 class="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-6 leading-tight bg-gradient-to-b from-white via-white/95 to-white/60 bg-clip-text text-transparent">
      Prontos para Criar o seu Sistema?
    </h1>
    <p class="text-base sm:text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed font-light">
      De vida a sua visao com a melhor tecnologia em nuvem, alto desempenho e suporte especializado.
    </p>
    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
      <a href="https://wa.me/258840000000?text=Quero%20criar%20o%20meu%20sistema%20online" target="_blank" class="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-2xl shadow-blue-600/30 transition-all hover:scale-105">Comecar Agora</a>
      <a href="https://wa.me/258840000000" target="_blank" class="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-bold text-sm transition-all">Falar com Consultor</a>
    </div>
    <div class="flex flex-wrap items-center justify-center gap-3 mt-10">
      <span class="text-xs text-gray-400 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">SSL Gratis</span>
      <span class="text-xs text-gray-400 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">99.9% Uptime</span>
      <span class="text-xs text-gray-400 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">Suporte em Portugues</span>
      <span class="text-xs text-gray-400 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">Pagamentos em MZN</span>
    </div>
  </main>
  <footer class="text-center text-xs text-slate-600 py-8 relative z-10">2026 WEHOSTHERE. Todos os direitos reservados.</footer>
</body>
</html>`;
  }

  const cleanTitle = title || (
    p.includes('restaurante') ? 'Restaurante e Lounge' :
    p.includes('barbearia') ? 'Barbearia VIP' :
    p.includes('hotel') || p.includes('resort') ? 'Hotel e Resort' :
    p.includes('loja') || p.includes('ecommerce') ? 'Boutique e Loja Online' :
    p.includes('portfolio') ? 'Portfolio Profissional' :
    'Pagina Profissional'
  );

  const firstLetter = cleanTitle.charAt(0).toUpperCase();

  return `<!DOCTYPE html>
<html lang="pt" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cleanTitle} - Site Oficial</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <style>* { box-sizing: border-box; margin: 0; padding: 0; } html,body { background:#020617; color:#f8fafc; font-family:'Plus Jakarta Sans',sans-serif; }</style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen">
  <div class="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-blue-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none -z-10"></div>
  <nav class="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/80">
    <div class="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
      <a href="#" class="flex items-center gap-3 group">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-blue-500/25 group-hover:scale-105 transition">${firstLetter}</div>
        <span class="text-xl font-bold tracking-tight text-white">${cleanTitle}</span>
      </a>
      <div class="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <a href="#sobre" class="hover:text-white transition">Sobre</a>
        <a href="#servicos" class="hover:text-white transition">Servicos</a>
        <a href="#contacto" class="hover:text-white transition">Contacto</a>
      </div>
      <a href="https://wa.me/258840000000" target="_blank" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all hover:scale-105">WhatsApp</a>
    </div>
  </nav>
  <section class="pt-24 pb-16 px-6 max-w-6xl mx-auto text-center">
    <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 mb-8 uppercase tracking-widest">
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
      Servico Profissional em Mocambique
    </div>
    <h1 class="text-5xl sm:text-7xl font-black tracking-tight mb-6 bg-gradient-to-b from-white via-white/90 to-white/50 bg-clip-text text-transparent leading-tight">${cleanTitle}</h1>
    <p class="text-slate-400 max-w-2xl mx-auto text-lg mb-10 leading-relaxed">Experiencia premium, qualidade garantida e o melhor atendimento.</p>
    <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
      <a href="https://wa.me/258840000000" target="_blank" class="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-base shadow-2xl transition hover:scale-105">Reservar Agora</a>
      <a href="#servicos" class="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:text-white font-bold text-base transition hover:bg-white/10">Ver Servicos</a>
    </div>
  </section>
  <section id="servicos" class="py-16 px-6 max-w-6xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">O Que Fazemos</h2>
      <h3 class="text-3xl sm:text-4xl font-extrabold text-white">Nossos Servicos em Destaque</h3>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition duration-300">
        <div class="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xl mb-6">01</div>
        <h4 class="text-xl font-bold text-white mb-3">Atendimento Premium</h4>
        <p class="text-slate-400 text-sm leading-relaxed">Equipe dedicada a proporcionar a melhor experiencia do inicio ao fim.</p>
      </div>
      <div class="p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition duration-300">
        <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl mb-6">02</div>
        <h4 class="text-xl font-bold text-white mb-3">Agilidade e Pontualidade</h4>
        <p class="text-slate-400 text-sm leading-relaxed">Garantimos rapidez na execucao e prazos respeitados com total transparencia.</p>
      </div>
      <div class="p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition duration-300">
        <div class="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xl mb-6">03</div>
        <h4 class="text-xl font-bold text-white mb-3">Solucoes Sob Medida</h4>
        <p class="text-slate-400 text-sm leading-relaxed">Adaptamos as nossas solucoes a escala e ambicao do seu negocio.</p>
      </div>
    </div>
  </section>
  <section id="contacto" class="py-16 px-6 max-w-6xl mx-auto">
    <div class="rounded-3xl p-10 md:p-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-center text-white shadow-2xl">
      <h3 class="text-3xl sm:text-5xl font-black mb-6 tracking-tight">Pronto para dar o proximo passo?</h3>
      <p class="text-blue-100 max-w-xl mx-auto mb-8 text-base">Fale diretamente connosco pelo WhatsApp.</p>
      <a href="https://wa.me/258840000000" target="_blank" class="inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-sm shadow-xl transition-all hover:scale-105">Conversar no WhatsApp Agora</a>
    </div>
  </section>
  <footer class="border-t border-slate-900 py-10 px-6 text-center text-xs text-slate-500">
    <p>2026 ${cleanTitle}. Todos os direitos reservados. Hospedado com alta velocidade na WEHOSTHERE.</p>
  </footer>
</body>
</html>`;
}

// ─── System Instruction ───────────────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `Voce e o Construtor de Sites IA da WEHOSTHERE (uma plataforma cloud em Mocambique).
Sua missao e gerar ou aprimorar uma pagina web HTML5 COMPLETA, AUTONOMA, MODERNA, RESPONSIVA e IMPRESSIONANTE para o cliente.
DIRETRIZES CRITICAS:
1. Retorne APENAS o codigo HTML completo (comecando em <!DOCTYPE html> e terminando em </html>). NAO inclua explicacoes ou texto antes ou depois.
2. Use Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
3. Use Google Fonts (Plus Jakarta Sans, Inter ou Outfit).
4. Cores elegantes e profissionais (dark mode moderno, gradientes suaves).
5. Estrutura: Navbar, Hero, Servicos, Depoimentos, CTA, Footer. Links WhatsApp formato https://wa.me/258...
6. Se houver HTML atual, REFINE e ATUALIZE aplicando as alteracoes pedidas.
7. Para paginas simples/inicio, mantenha limpo e elegante com o titulo: "Prontos para Criar o seu Sistema?"`;

// ─── Helper para enviar SSE ───────────────────────────────────────────────────
function makeSSE(controller: ReadableStreamDefaultController, encoder: TextEncoder) {
  return {
    chunk(text: string) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: text })}\n\n`));
    },
    done(explanation: string, diffSummary: string, executionSeconds: number) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', explanation, diffSummary, executionSeconds })}\n\n`));
      controller.close();
    },
    error(message: string) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message })}\n\n`));
      controller.close();
    }
  };
}

// ─── Simular streaming de string ja gerada ────────────────────────────────────
async function simulateStream(html: string, sse: ReturnType<typeof makeSSE>, chunkSize = 80, delay = 8) {
  for (let i = 0; i < html.length; i += chunkSize) {
    sse.chunk(html.slice(i, i + chunkSize));
    await new Promise(r => setTimeout(r, delay));
  }
}

// ─── Extrair HTML limpo de uma resposta de texto ─────────────────────────────
function extractHtml(raw: string): string {
  const match = raw.match(/```html([\s\S]*?)```/i) || raw.match(/```([\s\S]*?)```/i);
  const code = match ? match[1].trim() : raw.trim();
  if (code.toLowerCase().includes('<!doctype') || code.toLowerCase().includes('<html')) {
    return code;
  }
  return '';
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Payload invalido' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const { prompt = '', currentHtml = '', title = '' } = body;
  if (!prompt.trim()) {
    return new Response(JSON.stringify({ error: 'O prompt e obrigatorio' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const userPrompt = currentHtml
    ? `O utilizador quer alterar o site existente.\nPEDIDO: "${prompt}"\n\nHTML ATUAL:\n${currentHtml.slice(0, 30000)}\n\nAtualize mantendo o design coeso.`
    : `Crie um site profissional para: "${prompt}".\nTitulo sugerido: "${title || 'Site Profissional'}"`;

  const elapsed = () => Math.max(1, Math.round((Date.now() - startTime) / 1000));
  const okExplanation = currentHtml
    ? `O site foi atualizado com base no seu pedido: "${prompt}".`
    : `O site para "${prompt}" foi gerado e validado no preview.`;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const sse = makeSSE(controller, encoder);

      // ── 1. Gemini com streaming SSE real ───────────────────────────────────
      if (geminiKey) {
        try {
          const gemRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${geminiKey}&alt=sse`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${userPrompt}` }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
              })
            }
          );

          if (gemRes.ok && gemRes.body) {
            const reader = gemRes.body.getReader();
            const dec = new TextDecoder();
            let buf = '';
            let pre = '';       // acumula texto antes de encontrar HTML
            let started = false; // ja encontramos o inicio do HTML

            outer: while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += dec.decode(value, { stream: true });
              const lines = buf.split('\n');
              buf = lines.pop() ?? '';

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const raw = line.slice(6).trim();
                if (!raw || raw === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(raw);
                  const text: string = parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
                  if (!text) continue;

                  if (!started) {
                    pre += text;
                    const idx = pre.search(/<!DOCTYPE|<html/i);
                    if (idx >= 0) {
                      started = true;
                      sse.chunk(pre.slice(idx));
                      pre = '';
                    }
                  } else {
                    // Parar de emitir depois de </html>
                    const endIdx = text.toLowerCase().indexOf('</html>');
                    if (endIdx >= 0) {
                      sse.chunk(text.slice(0, endIdx + 7));
                      break outer;
                    }
                    sse.chunk(text);
                  }
                } catch { /* ignorar */ }
              }
            }

            if (started) {
              sse.done(okExplanation, currentHtml ? '+28 / -9' : '+180 linhas', elapsed());
              return;
            }
          }
        } catch (e) {
          console.warn('[Builder] Erro Gemini streaming:', e);
        }

        // ── 1b. Gemini modo normal com stream simulado ──────────────────────
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${SYSTEM_INSTRUCTION}\n\n${userPrompt}` }] }],
                generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
              })
            }
          );
          if (res.ok) {
            const data = await res.json();
            const rawText: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            const html = extractHtml(rawText);
            if (html) {
              await simulateStream(html, sse);
              sse.done(okExplanation, currentHtml ? '+28 / -9' : '+180 linhas', elapsed());
              return;
            }
          }
        } catch (e) {
          console.warn('[Builder] Erro Gemini normal:', e);
        }
      }

      // ── 2. OpenAI com streaming real ──────────────────────────────────────
      if (openaiKey) {
        try {
          const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              stream: true,
              messages: [
                { role: 'system', content: 'Retorne APENAS o codigo HTML5 completo (Tailwind via CDN, Google Fonts). Nada mais.' },
                { role: 'user', content: userPrompt }
              ],
              temperature: 0.7,
              max_tokens: 4096
            })
          });

          if (oaiRes.ok && oaiRes.body) {
            const reader = oaiRes.body.getReader();
            const dec = new TextDecoder();
            let buf = '';
            let pre = '';
            let started = false;

            outer2: while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += dec.decode(value, { stream: true });
              const lines = buf.split('\n');
              buf = lines.pop() ?? '';

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const raw = line.slice(6).trim();
                if (raw === '[DONE]') break outer2;
                try {
                  const parsed = JSON.parse(raw);
                  const delta: string = parsed?.choices?.[0]?.delta?.content ?? '';
                  if (!delta) continue;

                  if (!started) {
                    pre += delta;
                    const idx = pre.search(/<!DOCTYPE|<html/i);
                    if (idx >= 0) {
                      started = true;
                      sse.chunk(pre.slice(idx));
                      pre = '';
                    }
                  } else {
                    const endIdx = delta.toLowerCase().indexOf('</html>');
                    if (endIdx >= 0) {
                      sse.chunk(delta.slice(0, endIdx + 7));
                      break outer2;
                    }
                    sse.chunk(delta);
                  }
                } catch { /* ignorar */ }
              }
            }

            if (started) {
              sse.done(okExplanation, currentHtml ? '+28 / -9' : '+180 linhas', elapsed());
              return;
            }
          }
        } catch (e) {
          console.warn('[Builder] Erro OpenAI streaming:', e);
        }
      }

      // ── 3. Fallback estatico com stream simulado ──────────────────────────
      const fallback = getFallbackHtml(prompt, title);
      await simulateStream(fallback, sse, 60, 12);
      sse.done(
        currentHtml
          ? `Ajustamos o seu site com base no pedido: "${prompt}".`
          : `Pagina base criada para "${prompt}". Pode refiná-la agora!`,
        currentHtml ? '+18 / -5' : '+95 linhas',
        elapsed()
      );
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}
