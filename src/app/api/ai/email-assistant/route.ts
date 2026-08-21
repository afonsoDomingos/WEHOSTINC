import { NextRequest, NextResponse } from 'next/server';

// POST - Webmail AI Assistant (Summarize, Smart Reply, Improve Writing)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      action = 'summarize', 
      content = '', 
      subject = '', 
      from = '', 
      tone = 'professional',
      prompt = ''
    } = body;

    if (!content && !prompt) {
      return NextResponse.json({ error: 'Conteúdo é obrigatório' }, { status: 400 });
    }

    const cleanText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    // Check if Gemini or OpenAI API Key exists
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      try {
        let systemPrompt = '';
        if (action === 'summarize') {
          systemPrompt = 'Resuma o e-mail abaixo em português de forma clara e direta em 2 a 3 pontos-chave com marcadores (bullet points), destacando ações necessárias se houver.';
        } else if (action === 'reply') {
          systemPrompt = `Escreva uma resposta profissional de e-mail em português no tom "${tone}". O e-mail recebido é sobre "${subject}" de "${from}". Responda de forma cortês, estruturada e pronta para envio.`;
        } else if (action === 'improve') {
          systemPrompt = `Reescreva e aprimore o seguinte rascunho de e-mail em português, mantendo a mensagem central, mas com tom ${tone}, gramática perfeita, pontuação impecável e vocabulário corporativo de alto nível.`;
        }

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: `${systemPrompt}\n\nE-mail:\n${cleanText}\n\nInstrução adicional: ${prompt || 'Nenhuma'}` }]
            }]
          })
        });
        const data = await res.json();
        const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generated) {
          return NextResponse.json({ success: true, result: generated });
        }
      } catch (geminiErr) {
        console.warn('[AI Assistant] Gemini API fallback:', geminiErr);
      }
    }

    if (openaiKey) {
      try {
        let systemPrompt = 'Você é um assistente executivo de e-mails corporativos da WEHOSTHERE.';
        let userPrompt = '';

        if (action === 'summarize') {
          userPrompt = `Resuma o seguinte e-mail em 2 a 3 tópicos com ações pendentes:\n\n${cleanText}`;
        } else if (action === 'reply') {
          userPrompt = `Escreva uma resposta de e-mail com tom ${tone} para a seguinte mensagem:\n\nAssunto: ${subject}\nDe: ${from}\nMensagem: ${cleanText}`;
        } else if (action === 'improve') {
          userPrompt = `Aprimore este rascunho de e-mail com tom ${tone} e gramática impecável:\n\n${cleanText}`;
        }

        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.7
          })
        });
        const data = await res.json();
        const generated = data?.choices?.[0]?.message?.content;
        if (generated) {
          return NextResponse.json({ success: true, result: generated });
        }
      } catch (oaErr) {
        console.warn('[AI Assistant] OpenAI API fallback:', oaErr);
      }
    }

    // Built-in Smart Fallback Engine (Zero-config instant response)
    let fallbackResult = '';

    if (action === 'summarize') {
      const sentences = cleanText.split(/[.!?]+/).filter((s: string) => s.trim().length > 15);
      const topSentences = sentences.slice(0, 3).map((s: string) => `• ${s.trim()}`).join('\n');
      fallbackResult = `📌 **Resumo Inteligente da Mensagem:**\n\n${topSentences || '• Mensagem curta ou aviso de rotina.'}\n\n💡 **Ação recomendada:** Analisar os pontos solicitados e responder em tempo hábil.`;
    } else if (action === 'reply') {
      const senderName = from.split('<')[0].replace(/["']/g, '').trim() || 'Prezado(a)';
      if (tone === 'formal') {
        fallbackResult = `Prezado(a) ${senderName},\n\nAgradeço pelo contacto e pelas informações compartilhadas.\n\nRecepcionamos a sua mensagem referente a "${subject || 'este assunto'}" e já estamos a dar o devido seguimento.\n\nQualquer dúvida adicional ou atualização, estarei inteiramente à disposição.\n\nCom os melhores cumprimentos,\nEquipa`;
      } else if (tone === 'friendly') {
        fallbackResult = `Olá ${senderName},\n\nMuito obrigado pelo seu e-mail!\n\nConfirmamos a receção e já estamos a analisar com atenção. Em breve retornaremos com mais detalhes.\n\nTenha um excelente dia!\n\nAtenciosamente,`;
      } else if (tone === 'quick_accept') {
        fallbackResult = `Prezado(a) ${senderName},\n\nConfirmamos a receção e estamos de acordo com os termos apresentados.\n\nAvançaremos com os próximos passos conforme acordado.\n\nObrigado,\nEquipa`;
      } else if (tone === 'quick_decline') {
        fallbackResult = `Prezado(a) ${senderName},\n\nAgradecemos sinceramente pela proposta e pela consideração.\n\nNo momento, avaliámos a solicitação e não será possível prosseguir com esta solicitação específica.\n\nFicamos em contacto para futuras oportunidades.\n\nCordialmente,`;
      } else {
        fallbackResult = `Estimado(a) ${senderName},\n\nObrigado pela sua mensagem. Confirmamos que foi recebida e já se encontra em análise.\n\nEntraremos em contacto muito em breve.\n\nMelhores cumprimentos,`;
      }
    } else if (action === 'improve') {
      // Clean up and polish format
      const lines = cleanText.split(/\n+/).map((l: string) => l.trim()).filter(Boolean);
      fallbackResult = `Prezado(a),\n\n${lines.join('\n\n')}\n\nFicamos à total disposição para quaisquer esclarecimentos adicionais.\n\nAtenciosamente,`;
    }

    return NextResponse.json({
      success: true,
      result: fallbackResult
    });
  } catch (error: any) {
    console.error('[AI Email Assistant POST] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao processar requisição com IA' },
      { status: 500 }
    );
  }
}
