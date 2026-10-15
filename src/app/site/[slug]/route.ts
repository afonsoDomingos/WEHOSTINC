import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import AiSiteModel from '@/lib/models/AiSite';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { slug } = await params;
    if (!slug) {
      return new Response('Slug inválido', { status: 400 });
    }

    await connectDB();
    const site = await AiSiteModel.findOneAndUpdate(
      { slug: slug.toLowerCase() },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();

    if (!site || !site.htmlContent) {
      return new Response(
        `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <title>Site Não Encontrado — WEHOSTHERE</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen flex items-center justify-center p-6 text-center font-sans">
  <div class="max-w-md">
    <div class="w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-500 mx-auto flex items-center justify-center text-3xl font-black mb-6">?</div>
    <h1 class="text-2xl font-bold mb-3">Site Não Encontrado</h1>
    <p class="text-slate-400 text-sm mb-6">Este endereço não existe ou ainda não foi publicado na plataforma WEHOSTHERE.</p>
    <a href="https://www.wehosthere.com" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition">Ir para WEHOSTHERE</a>
  </div>
</body>
</html>`,
        {
          status: 404,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        }
      );
    }

    // Retorna o HTML puro sem intervenção de layouts externos
    return new Response(site.htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        'X-Powered-By': 'WEHOSTHERE AI Cloud',
      },
    });
  } catch (err: any) {
    console.error('Erro ao servir site público:', err);
    return new Response('Erro interno do servidor', { status: 500 });
  }
}
