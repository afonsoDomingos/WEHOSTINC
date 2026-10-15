import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connectDB } from '@/lib/mongodb';
import AiSiteModel from '@/lib/models/AiSite';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    await connectDB();
    const site = await AiSiteModel.findOne({ slug: slug.toLowerCase() }).lean();
    if (!site) return { title: 'Site Não Encontrado — WEHOSTHERE' };

    return {
      title: `${site.title} | WEHOSTHERE`,
      description: `Website gerado e alojado na nuvem da WEHOSTHERE.`,
      openGraph: {
        title: site.title,
        description: 'Website oficial alojado na infraestrutura WEHOSTHERE',
      }
    };
  } catch {
    return { title: 'WEHOSTHERE AI Sites' };
  }
}

export default async function PublicAiSitePage({ params }: Props) {
  const { slug } = await params;

  let site: any = null;
  try {
    await connectDB();
    site = await AiSiteModel.findOneAndUpdate(
      { slug: slug.toLowerCase() },
      { $inc: { views: 1 } },
      { new: true }
    ).lean();
  } catch (err) {
    console.error('Erro ao buscar site por slug:', err);
  }

  if (!site || !site.htmlContent) {
    notFound();
  }

  // Renderiza o HTML completo de forma transparente
  return (
    <html lang="pt" dangerouslySetInnerHTML={{ __html: site.htmlContent }} />
  );
}
