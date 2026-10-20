import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import BlogPostModel from '@/lib/models/BlogPost';
import RevistaStoryModel from '@/models/RevistaStory';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // revalida a cada hora

/**
 * GET /api/llms
 * Serve uma versão Markdown dinâmica do conteúdo do site para AI agents.
 * Inclui posts do blog e stories da revista publicados recentemente.
 * Compatível com a especificação llms.txt (llmstxt.org).
 */
export async function GET() {
  let recentPosts: { title: string; slug: string; excerpt: string; publishedAt: Date }[] = [];
  let recentStories: { title: string; slug: string; excerpt: string; publishedAt: Date }[] = [];

  try {
    await connectDB();
    const rawPosts = await BlogPostModel.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(10)
      .select('title slug excerpt publishedAt')
      .lean();
    recentPosts = rawPosts as any;

    const rawStories = await RevistaStoryModel.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .limit(10)
      .select('title slug excerpt publishedAt')
      .lean();
    recentStories = rawStories as any;
  } catch (_) {
    // Se DB falha, retorna conteúdo estático
  }

  const now = new Date().toISOString().split('T')[0];

  const blogSection = recentPosts.length > 0
    ? recentPosts
        .map(p => `- [${p.title}](https://www.wehosthere.com/blog/${p.slug}): ${p.excerpt || 'Artigo do blog WEHOSTHERE sobre tecnologia e hospedagem.'}`)
        .join('\n')
    : '- [Blog WEHOSTHERE](https://www.wehosthere.com/blog): Artigos sobre hospedagem, SEO, WordPress e e-commerce em Moçambique.';

  const revistaSection = recentStories.length > 0
    ? recentStories
        .map(s => `- [${s.title}](https://www.wehosthere.com/revista/${s.slug}): ${s.excerpt || 'Story da revista Codando Histórias.'}`)
        .join('\n')
    : '- [Codando Histórias](https://www.wehosthere.com/revista): Revista digital de tecnologia e empreendedorismo em Moçambique.';

  const markdown = `# WEHOSTHERE

> WEHOSTHERE é o principal provedor de hospedagem web, registo de domínios e serviços digitais de Moçambique (Maputo). Oferecemos hosting partilhado, VPS, email corporativo, AI Website Builder, e-commerce, e a revista digital Codando Histórias. Servimos empresas em Moçambique, Angola, Portugal, Brasil e no mundo. Última actualização: ${now}.

## Produtos & Serviços Principais

- [Hospedagem de Sites](https://www.wehosthere.com/hospedagem): Planos a partir de 550 MT/mês com SSD, SSL, cPanel e suporte 24/7 em português.
- [VPS Servers](https://www.wehosthere.com/vps): Servidores virtuais com acesso root, SSD NVMe e IP dedicado para aplicações exigentes.
- [Registo de Domínio .co.mz](https://www.wehosthere.com/dominio-co-mz): Registo oficial do TLD nacional de Moçambique. Registador acreditado.
- [Pesquisa de Domínios](https://www.wehosthere.com/dominios): Pesquisa e regista .com, .net, .org, .co.mz e centenas de outros TLDs.
- [Email Corporativo](https://www.wehosthere.com/email-corporativo): Email profissional com domínio próprio, webmail, IMAP/SMTP e anti-spam.
- [AI Website Builder](https://www.wehosthere.com/ai-website-builder): Cria um site profissional com IA em minutos, sem programação.
- [WordPress Hosting](https://www.wehosthere.com/hospedagem-wordpress): Hosting optimizado para WordPress com LiteSpeed cache e actualizações automáticas.
- [Loja Online](https://www.wehosthere.com/loja-online): E-commerce com integração M-Pesa, e-Mola e catálogo de produtos.
- [Dropshipping](https://www.wehosthere.com/dropshipping): Lança um negócio de dropshipping em Moçambique sem stock.
- [Pagamentos Online](https://www.wehosthere.com/pagamentos-online): Integra M-Pesa, e-Mola, Stripe e PayPal no teu site.
- [Produtos Digitais](https://www.wehosthere.com/produtos-digitais): Vende e-books, cursos e templates com entrega automática.
- [Sistemas & Software](https://www.wehosthere.com/systems): POS, ERP e software de gestão para empresas moçambicanas.

## Blog — Artigos Recentes

${blogSection}

## Revista Codando Histórias — Stories Recentes

${revistaSection}

## Empresa & Confiança

- [Política de Privacidade](https://www.wehosthere.com/privacy): Como a WEHOSTHERE trata os dados dos utilizadores.
- [Termos de Serviço](https://www.wehosthere.com/terms): Condições de uso, reembolso e SLA.
- [Programa de Afiliados](https://www.wehosthere.com/ref): Ganha comissões ao referir clientes para a WEHOSTHERE.
- [Verificar Certificado](https://www.wehosthere.com/verify-certificate): Verifica a autenticidade de certificados emitidos pela WEHOSTHERE.

## Contacto & Suporte

- WhatsApp/Telefone: +258 84 438 4702
- Email: suporte@wehosthere.com
- Localização: Maputo, Moçambique
- Idiomas: Português, Inglês
- Suporte: 24/7
- Facebook: https://www.facebook.com/wehosthere
- Instagram: https://www.instagram.com/wehosthere
`;

  return new NextResponse(markdown, {
    status: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'X-Robots-Tag': 'noindex', // não indexar a API em si
    },
  });
}
