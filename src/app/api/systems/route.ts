import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import SystemForRentModel from '@/lib/models/SystemForRent';

export const DEFAULT_SYSTEMS_DATA = [
  {
    id: 'SYS-1001',
    name: 'Sistema de Gestão Financeira',
    shortDescription: 'Gestão completa de caixa, receitas, despesas, faturamento M-Pesa e relatórios financeiros em tempo real.',
    description: 'Solução completa para controlo financeiro de pequenas, médias e grandes empresas em Moçambique. Inclui módulos de fluxo de caixa, gestão de contas a pagar/receber, emissão de faturas proforma e recibos, além de integração com M-Pesa e relatórios estatísticos em gráficos.',
    category: 'Finanças & Contabilidade',
    image: '/servidores-banner.png',
    demoUrl: 'https://demo.wehosthere.com/gestao-financeira',
    features: [
      'Controle de Fluxo de Caixa Diário',
      'Faturamento & Emissão de Recibos',
      'Integração de Pagamentos M-Pesa & eMola',
      'Gestão de Clientes e Contas a Receber',
      'Relatórios Financeiros em PDF e Excel',
      'Acesso Multi-utilizador com Permissões'
    ],
    monthlyPrice: 2500,
    yearlyPrice: 25000,
    setupFee: 0,
    isActive: true,
    approvalStatus: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'SYS-1002',
    name: 'Sistema de Gestão de Inscrições',
    shortDescription: 'Gestão de matrículas, inscrições escolares/eventos, controle de estudantes e pagamentos de propinas.',
    description: 'Plataforma especializada na gestão de inscrições e matrículas para escolas, institutos, centros de formação, workshops e conferências em Moçambique. Permite submissão de documentos online, validação automática de pagamentos e emissão de cartões/comprovativos.',
    category: 'Educação & Eventos',
    image: '/servidores-banner.png',
    demoUrl: 'https://demo.wehosthere.com/gestao-inscricoes',
    features: [
      'Formulário de Inscrição Online Personalizado',
      'Controle de Matrículas e Listas de Turmas/Eventos',
      'Validação de Comprovativos M-Pesa & Transferência',
      'Envio Automático de Confirmação por SMS/Email',
      'Emissão de Credenciais & Cartões Digitais',
      'Painel de Estatísticas de Candidatos'
    ],
    monthlyPrice: 2000,
    yearlyPrice: 20000,
    setupFee: 0,
    isActive: true,
    approvalStatus: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'SYS-1003',
    name: 'Página de Vendas Profissional',
    shortDescription: 'Landing Page de alta conversão para produtos e serviços com botão WhatsApp e checkout M-Pesa integrado.',
    description: 'Sistema completo de Página de Vendas (Landing Page Comercial) otimizado para maximizar conversões. Inclui formulários de captura de leads, cronómetro de oferta limitada, botão direto de WhatsApp, depoimentos em carrossel e integração imediata com M-Pesa.',
    category: 'Marketing & Vendas',
    image: '/servidores-banner.png',
    demoUrl: 'https://demo.wehosthere.com/pagina-vendas',
    features: [
      'Design Responsivo de Alta Conversão (Mobile-First)',
      'Checkout Direto M-Pesa & Cartão de Crédito',
      'Botão Flutuante de Atendimento WhatsApp',
      'Formulário de Captação de Clientes (Leads)',
      'Temporizador / Cronómetro de Oferta Limitada',
      'SEO Otimizado para Motores de Busca'
    ],
    monthlyPrice: 1500,
    yearlyPrice: 15000,
    setupFee: 0,
    isActive: true,
    approvalStatus: 'approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

async function tryMongo() {
  try {
    await connectDB();
    return true;
  } catch (err) {
    console.warn('MongoDB connection issue (systems):', err);
    return false;
  }
}

export async function GET() {
  try {
    if (await tryMongo()) {
      let systems = await SystemForRentModel.find({}).lean();
      if (!systems || systems.length === 0) {
        await SystemForRentModel.insertMany(DEFAULT_SYSTEMS_DATA);
        systems = await SystemForRentModel.find({}).lean();
      }
      return NextResponse.json({ systems });
    }
  } catch (e) { console.error('MongoDB indisponível (systems):', e); }
  return NextResponse.json({ systems: DEFAULT_SYSTEMS_DATA });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, system, systemId, updates } = body;

    if (await tryMongo()) {
      if (action === 'create') {
        await SystemForRentModel.create(system);
        return NextResponse.json({ success: true });
      }

      if (action === 'update') {
        await SystemForRentModel.updateOne({ id: systemId }, { $set: updates });
        return NextResponse.json({ success: true });
      }

      if (action === 'delete') {
        await SystemForRentModel.deleteOne({ id: systemId });
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar sistemas:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
