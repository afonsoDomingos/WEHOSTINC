import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = 'improve_content',
      title = '',
      content = '',
      category = 'codigo',
      customPrompt = '',
    } = body;

    if (!content && !title) {
      return NextResponse.json(
        { error: 'Por favor forneça pelo menos um título ou o conteúdo da história.' },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Definição do prompt de acordo com a acção solicitada
    let systemInstruction = `És o Editor-Chefe e Copiloto de IA da revista digital "Codando Histórias" da WEHOSTHERE (revista moçambicana de tech, programação, startups e inovação).
O teu objectivo é apoiar criadores, desenvolvedores e fundadores a expressarem a sua jornada com clareza, impacto e formato editorial de excelência em Português fluente.
Preserva sempre a voz e as ideias autênticas do autor.`;

    let userInstruction = '';

    if (action === 'suggest_titles') {
      userInstruction = `Com base no seguinte rascunho de história na categoria "${category}":
Título atual: "${title}"
Conteúdo:
${content.slice(0, 1500)}

Gera 3 opções de títulos altamente atraentes e impactantes no estilo revista tech moderna.
Para cada título, indica também uma palavra ou expressão curta (2 a 4 palavras) que deve ficar com o realce colorido da revista (highlightText).

Responde ESTRITAMENTE em formato JSON válido com este esquema:
{
  "suggestions": [
    { "title": "Como escalei a minha aplicação para 10 mil utilizadores", "highlight": "10 mil utilizadores" },
    { "title": "Os 4 maiores erros que cometi no meu primeiro SaaS", "highlight": "4 maiores erros" },
    { "title": "Do zero ao primeiro emprego remoto de programação em Moçambique", "highlight": "primeiro emprego remoto" }
  ]
}`;
    } else if (action === 'generate_excerpt') {
      userInstruction = `Com base neste artigo de tech:
Título: "${title}"
Conteúdo:
${content.slice(0, 2000)}

Cria um resumo impactante e magnético de 1 a 2 frases (máximo 160 caracteres) para aparecer no cartão de capa da revista e captar a atenção do leitor.
Responde apenas com o texto do resumo, sem aspas nem introduções.`;
    } else if (action === 'suggest_tags') {
      userInstruction = `Com base neste artigo de tech intitulado "${title}":
${content.slice(0, 1500)}

Sugere entre 4 a 6 tags técnicas e temáticas (em minúsculas, separadas por vírgula) ideais para categorizar o artigo na revista (ex: nextjs, carreira, mozambique, react, saas).
Responde apenas com as tags separadas por vírgulas.`;
    } else {
      // action === 'improve_content'
      userInstruction = `Por favor, revisa, pole e aprimora o conteúdo abaixo para a revista "Codando Histórias".
Instruções obrigatórias:
1. Corrige erros ortográficos, gramaticais e de concordância em Português.
2. Melhora a fluidez, o ritmo e o impacto das frases, sem alterar a mensagem real do autor.
3. Mantém a formatação Markdown (usa ## para títulos de secções, > para citações marcantes, e listas com * ou 1.).
4. Se o texto estiver desformatado ou em bloco único, organiza-o em secções claras (ex: Introdução, Desafio, Solução/Stack, Lições Aprendidas, Conclusão).
${customPrompt ? `Instrução extra do autor: ${customPrompt}` : ''}

Título da história: ${title || 'Sem título'}
Conteúdo original do autor:
${content}

Responde apenas com o conteúdo Markdown aprimorado, sem notas adicionais antes ou depois.`;
    }

    // 1. Tentar Gemini API
    if (geminiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `${systemInstruction}\n\n${userInstruction}`,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            return formatAiResponse(action, rawText);
          }
        }
      } catch (geminiErr) {
        console.warn('[AI Assistant Revista] Gemini falhou, tentando fallback:', geminiErr);
      }
    }

    // 2. Tentar OpenAI Fallback
    if (openaiKey) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: userInstruction },
            ],
            temperature: 0.7,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data?.choices?.[0]?.message?.content;
          if (rawText) {
            return formatAiResponse(action, rawText);
          }
        }
      } catch (openAiErr) {
        console.warn('[AI Assistant Revista] OpenAI falhou:', openAiErr);
      }
    }

    // 3. Fallback inteligente local caso não haja chaves ou APIs externas
    return fallbackResponse(action, title, content);
  } catch (err: any) {
    console.error('[AI Assistant Revista POST]', err);
    return NextResponse.json(
      { error: err.message || 'Erro interno ao processar assistência por IA.' },
      { status: 500 }
    );
  }
}

function formatAiResponse(action: string, rawText: string) {
  const clean = rawText.trim();

  if (action === 'suggest_titles') {
    try {
      const jsonMatch = clean.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed?.suggestions) {
          return NextResponse.json({ success: true, result: parsed.suggestions });
        }
      }
    } catch (_) {}
  }

  return NextResponse.json({ success: true, result: clean });
}

function fallbackResponse(action: string, title: string, content: string) {
  if (action === 'suggest_titles') {
    const base = title.trim() || 'Minha Jornada no Desenvolvimento';
    return NextResponse.json({
      success: true,
      result: [
        { title: `Como construí: ${base}`, highlight: 'Como construí' },
        { title: `O guia definitivo para ${base}`, highlight: 'guia definitivo' },
        { title: `${base}: o que aprendi e faria diferente`, highlight: 'o que aprendi' },
      ],
    });
  }

  if (action === 'generate_excerpt') {
    const firstLine = content.split('\n').find(l => l.trim().length > 30) || content;
    const cleanExcerpt = firstLine.replace(/^[#>*\-\s]+/, '').slice(0, 140) + '...';
    return NextResponse.json({ success: true, result: cleanExcerpt });
  }

  if (action === 'suggest_tags') {
    return NextResponse.json({ success: true, result: 'tecnologia, mozambique, codigo, carreira, inovacao' });
  }

  // fallback para improve_content
  let polished = content.trim();
  if (!polished.includes('## ')) {
    polished = `## O Ponto de Partida\n\n${polished}\n\n## Lições Aprendidas\n* Compartilhar conhecimento fortalece o ecossistema local.\n* A consistência é a chave para o sucesso em desenvolvimento.`;
  }
  return NextResponse.json({ success: true, result: polished });
}
