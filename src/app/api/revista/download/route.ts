import { NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { connectDB } from '@/lib/mongodb';
import RevistaStory from '@/models/RevistaStory';
import { INITIAL_STORIES } from '@/lib/revistaData';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let stories: any[] = [];

    if (process.env.MONGODB_URI) {
      try {
        await connectDB();
        stories = await RevistaStory.find({ status: 'published' })
          .sort({ publishedAt: -1, createdAt: -1 })
          .limit(8)
          .lean();
      } catch (err) {
        console.warn('[Revista PDF] Erro ao buscar histórias no MongoDB:', err);
      }
    }

    if (!stories || stories.length === 0) {
      stories = INITIAL_STORIES.slice(0, 5);
    }

    // Criar o documento PDF
    const pdfDoc = await PDFDocument.create();
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Cores da marca WEHOSTHERE
    const purplePrimary = rgb(0.35, 0.09, 0.60); // #5A189A
    const purpleDark = rgb(0.14, 0.0, 0.27);    // #240046
    const purpleLight = rgb(0.48, 0.17, 0.75);   // #7B2CBF
    const textDark = rgb(0.06, 0.09, 0.16);      // #0f172a
    const textMuted = rgb(0.39, 0.45, 0.55);     // #64748b
    const white = rgb(1, 1, 1);
    const lightBg = rgb(0.97, 0.98, 0.99);

    // ──────────────────────────────────────────────
    // PÁGINA 1: CAPA DA REVISTA
    // ──────────────────────────────────────────────
    const coverPage = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width: cWidth, height: cHeight } = coverPage.getSize();

    // Fundo da capa com gradiente simulado
    coverPage.drawRectangle({
      x: 0,
      y: 0,
      width: cWidth,
      height: cHeight,
      color: purpleDark,
    });

    // Faixa de destaque no topo
    coverPage.drawRectangle({
      x: 0,
      y: cHeight - 120,
      width: cWidth,
      height: 120,
      color: purplePrimary,
    });

    // Badge Edição
    coverPage.drawRectangle({
      x: 40,
      y: cHeight - 65,
      width: 75,
      height: 24,
      color: white,
    });
    coverPage.drawText('EDIÇÃO 01', {
      x: 48,
      y: cHeight - 58,
      size: 11,
      font: helveticaBold,
      color: purplePrimary,
    });

    coverPage.drawText('REVISTA DIGITAL OFICIAL • WEHOSTHERE', {
      x: 130,
      y: cHeight - 56,
      size: 10,
      font: helveticaBold,
      color: rgb(0.88, 0.67, 1.0),
    });

    // Título principal da Revista
    coverPage.drawText('codando histórias', {
      x: 40,
      y: cHeight - 190,
      size: 38,
      font: helveticaBold,
      color: white,
    });

    coverPage.drawText('A REVISTA TECH DE MOÇAMBIQUE', {
      x: 42,
      y: cHeight - 215,
      size: 13,
      font: helveticaBold,
      color: rgb(0.88, 0.67, 1.0),
    });

    // Linha decorativa
    coverPage.drawRectangle({
      x: 40,
      y: cHeight - 230,
      width: cWidth - 80,
      height: 2,
      color: purpleLight,
    });

    // Matéria de Capa
    const topStory = stories[0] || {
      title: 'Como construí o meu primeiro SaaS com Next.js em 30 dias',
      author: { name: 'Afonso Domingos' },
      excerpt: 'Saí do zero, sem investimento externo, e lancei um produto que hoje paga as minhas contas.',
    };

    coverPage.drawRectangle({
      x: 40,
      y: 200,
      width: cWidth - 80,
      height: 360,
      color: rgb(0.2, 0.05, 0.35),
    });

    coverPage.drawText('HISTÓRIA PRINCIPAL', {
      x: 65,
      y: 520,
      size: 11,
      font: helveticaBold,
      color: rgb(0.9, 0.7, 1.0),
    });

    // Título da matéria principal
    const mainTitle = topStory.title || 'História de Destaque';
    const splitTitle1 = mainTitle.length > 35 ? mainTitle.slice(0, 35) + '...' : mainTitle;
    coverPage.drawText(splitTitle1, {
      x: 65,
      y: 480,
      size: 22,
      font: helveticaBold,
      color: white,
    });

    // Resumo
    const mainExcerpt = topStory.excerpt || '';
    const splitExc1 = mainExcerpt.slice(0, 60);
    const splitExc2 = mainExcerpt.slice(60, 120);

    coverPage.drawText(splitExc1, {
      x: 65,
      y: 440,
      size: 12,
      font: helvetica,
      color: rgb(0.9, 0.9, 0.95),
    });
    if (splitExc2) {
      coverPage.drawText(splitExc2 + '...', {
        x: 65,
        y: 420,
        size: 12,
        font: helvetica,
        color: rgb(0.9, 0.9, 0.95),
      });
    }

    coverPage.drawText(`Por: ${topStory.author?.name || 'WEHOSTHERE'}`, {
      x: 65,
      y: 380,
      size: 11,
      font: helveticaBold,
      color: rgb(0.8, 0.6, 1.0),
    });

    // Destaques da Edição
    coverPage.drawText('NESTA EDIÇÃO:', {
      x: 65,
      y: 320,
      size: 10,
      font: helveticaBold,
      color: rgb(0.8, 0.8, 0.9),
    });

    stories.slice(1, 4).forEach((s, i) => {
      const itemTitle = s.title.length > 48 ? s.title.slice(0, 48) + '...' : s.title;
      coverPage.drawText(`•  ${itemTitle}`, {
        x: 65,
        y: 290 - i * 25,
        size: 10,
        font: helvetica,
        color: white,
      });
    });

    // Rodapé da Capa
    coverPage.drawRectangle({
      x: 0,
      y: 0,
      width: cWidth,
      height: 60,
      color: rgb(0.08, 0.0, 0.16),
    });

    coverPage.drawText('WEHOSTHERE • www.wehosthere.com/revista • Maputo, Moçambique', {
      x: 100,
      y: 25,
      size: 10,
      font: helveticaBold,
      color: rgb(0.7, 0.7, 0.8),
    });

    // ──────────────────────────────────────────────
    // PÁGINA 2: ÍNDICE E HISTÓRIAS
    // ──────────────────────────────────────────────
    const page2 = pdfDoc.addPage([595.28, 841.89]);
    const { width: pWidth, height: pHeight } = page2.getSize();

    // Top banner página 2
    page2.drawRectangle({
      x: 0,
      y: pHeight - 70,
      width: pWidth,
      height: 70,
      color: purplePrimary,
    });

    page2.drawText('codando histórias — Edição 01', {
      x: 40,
      y: pHeight - 42,
      size: 16,
      font: helveticaBold,
      color: white,
    });

    page2.drawText('ÍNDICE DE ARTIGOS & HISTÓRIAS', {
      x: 40,
      y: pHeight - 110,
      size: 14,
      font: helveticaBold,
      color: purplePrimary,
    });

    let currentY = pHeight - 150;

    stories.forEach((st, idx) => {
      if (currentY < 120) return;

      // Card do artigo
      page2.drawRectangle({
        x: 40,
        y: currentY - 70,
        width: pWidth - 80,
        height: 65,
        color: lightBg,
      });

      page2.drawRectangle({
        x: 40,
        y: currentY - 70,
        width: 4,
        height: 65,
        color: purpleLight,
      });

      // Categoria
      page2.drawText((st.category || 'CÓDIGO').toUpperCase(), {
        x: 55,
        y: currentY - 20,
        size: 9,
        font: helveticaBold,
        color: purplePrimary,
      });

      // Título
      const safeTitle = st.title.length > 55 ? st.title.slice(0, 55) + '...' : st.title;
      page2.drawText(safeTitle, {
        x: 55,
        y: currentY - 36,
        size: 12,
        font: helveticaBold,
        color: textDark,
      });

      // Autor e link
      const authorName = st.author?.name || 'WEHOSTHERE';
      page2.drawText(`Autor: ${authorName}  •  Ler online em: wehosthere.com/revista/${st.slug}`, {
        x: 55,
        y: currentY - 54,
        size: 9,
        font: helvetica,
        color: textMuted,
      });

      currentY -= 85;
    });

    // Rodapé página 2
    page2.drawRectangle({
      x: 40,
      y: 40,
      width: pWidth - 80,
      height: 50,
      color: rgb(0.93, 0.9, 0.98),
    });

    page2.drawText('Esta edição foi gerada digitalmente pela plataforma WEHOSTHERE.', {
      x: 60,
      y: 68,
      size: 9,
      font: helveticaBold,
      color: purplePrimary,
    });

    page2.drawText('Partilhe conhecimento e inspire outros programadores e criadores de Moçambique!', {
      x: 60,
      y: 52,
      size: 8,
      font: helvetica,
      color: textMuted,
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Codando-Historias-Edicao-01.pdf"',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('[Revista Download PDF] Erro:', error);
    return NextResponse.json({ error: 'Erro ao gerar PDF da revista' }, { status: 500 });
  }
}
