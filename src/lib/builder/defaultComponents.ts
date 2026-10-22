// ============================================================================
// ðŸŽ¨ WEHOSTHERE VISUAL BUILDER â€” COMPONENTES PADRÃO & BIBLIOTECA ELEMENTOR-LIKE
// ============================================================================

import {
  ComponentType,
  VisualComponent,
  SiteDocument,
  PageDocument,
  GlobalSiteTheme,
} from './types';

export function generateComponentId(prefix = 'comp'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

// â”€â”€â”€ Metadados dos Componentes para a Barra Lateral (Elementor Palette) â”€â”€â”€â”€â”€
export interface ComponentMeta {
  type: ComponentType;
  title: string;
  category: 'layout' | 'basic' | 'blocks';
  icon: string;
  description: string;
}

export const COMPONENT_CATALOG: ComponentMeta[] = [
  // Layout
  { type: 'section', title: 'Secção', category: 'layout', icon: 'Layout', description: 'Bloco de largura total com container centrado' },
  { type: 'container', title: 'Container', category: 'layout', icon: 'Box', description: 'Caixa de conteúdo com largura máxima' },
  { type: 'grid', title: 'Grelha (Grid)', category: 'layout', icon: 'Grid3X3', description: 'Distribuição em colunas responsivas' },
  { type: 'row', title: 'Linha Flex', category: 'layout', icon: 'Rows', description: 'Linha horizontal flexível com espaçamento' },
  { type: 'column', title: 'Coluna', category: 'layout', icon: 'Columns', description: 'Coluna vertical flexível' },
  { type: 'navbar', title: 'Menu Superior', category: 'layout', icon: 'Navigation', description: 'Barra de navegação com logotipo e links' },
  { type: 'footer', title: 'Rodapé', category: 'layout', icon: 'PanelBottom', description: 'Rodapé com links, direitos e redes sociais' },

  // Conteúdo Básico
  { type: 'heading', title: 'Título', category: 'basic', icon: 'Heading', description: 'Títulos H1 a H6 com tipografia expressiva' },
  { type: 'text', title: 'Texto / Parágrafo', category: 'basic', icon: 'AlignLeft', description: 'Bloco de texto com formatação visual' },
  { type: 'button', title: 'Botão CTA', category: 'basic', icon: 'MousePointerClick', description: 'Botão de ação clicável com variantes de estilo' },
  { type: 'image', title: 'Imagem', category: 'basic', icon: 'Image', description: 'Imagem responsiva com cantos arredondados' },
  { type: 'icon', title: 'Ícone', category: 'basic', icon: 'Sparkles', description: 'Ícone Lucide com cor e tamanho ajustáveis' },
  { type: 'badge', title: 'Distintivo / Pill', category: 'basic', icon: 'Tag', description: 'Etiqueta compacta para destacar novidades' },
  { type: 'divider', title: 'Separador', category: 'basic', icon: 'Minus', description: 'Linha divisória sutil com gradiente' },
  { type: 'spacer', title: 'Espaçador', category: 'basic', icon: 'MoveVertical', description: 'Espaço em branco para respiro visual' },

  // Blocos Compostos
  { type: 'card', title: 'Card de Destaque', category: 'blocks', icon: 'SquareCode', description: 'Card com ícone, título, descrição e link' },
  { type: 'features', title: '3 Benefícios', category: 'blocks', icon: 'CheckCircle2', description: 'Grelha de 3 recursos com ícones modernos' },
  { type: 'pricing-table', title: 'Tabela de Preços', category: 'blocks', icon: 'CreditCard', description: 'Planos comparativos com plano destaque' },
  { type: 'testimonials', title: 'Depoimentos', category: 'blocks', icon: 'Quote', description: 'Avaliações de clientes com estrelas e fotos' },
  { type: 'faq', title: 'Perguntas Frequentes', category: 'blocks', icon: 'HelpCircle', description: 'Lista de FAQ com respostas em acordeão' },
  { type: 'contact-form', title: 'Formulário', category: 'blocks', icon: 'Mail', description: 'Formulário de contacto com validação' },
  { type: 'whatsapp-button', title: 'Botão WhatsApp', category: 'blocks', icon: 'MessageCircle', description: 'Botão com link direto para conversa no WhatsApp' },
  { type: 'custom-html', title: 'HTML Livre', category: 'blocks', icon: 'Code', description: 'Bloco de código livre para embeds ou widgets' },
];

// â”€â”€â”€ Tema Global Padrão â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const DEFAULT_THEME: GlobalSiteTheme = {
  primaryColor: '#3b82f6',
  secondaryColor: '#6366f1',
  accentColor: '#10b981',
  backgroundColor: '#0a0f1d',
  textColor: '#f8fafc',
  fontFamily: 'Inter',
  headingFontFamily: 'Outfit',
  borderRadius: 'rounded-2xl',
  mode: 'dark',
};

// â”€â”€â”€ Fábrica de Componentes Padrão â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function createDefaultComponent(type: ComponentType, customName?: string): VisualComponent {
  const id = generateComponentId(type);

  switch (type) {
    case 'hero':
      return createHeroSection();

    case 'section':
      return {
        id,
        type: 'section',
        name: customName || 'Secção',
        content: {},
        styles: {
          desktop: {
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '24px',
            paddingRight: '24px',
            backgroundColor: 'transparent',
            customClasses: 'relative overflow-hidden w-full',
          },
        },
        parentId: null,
        children: [
          createDefaultComponent('container', 'Container da Secção'),
        ],
      };

    case 'container':
      return {
        id,
        type: 'container',
        name: customName || 'Container Central',
        content: {},
        styles: {
          desktop: {
            maxWidth: '1280px',
            marginLeft: 'auto',
            marginRight: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            customClasses: 'w-full',
          },
        },
        parentId: null,
        children: [],
      };

    case 'row':
      return {
        id,
        type: 'row',
        name: customName || 'Linha Flexível',
        content: {},
        styles: {
          desktop: {
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            customClasses: 'w-full flex-wrap md:flex-nowrap',
          },
          mobile: {
            flexDirection: 'column',
          },
        },
        parentId: null,
        children: [
          createDefaultComponent('column', 'Coluna 1'),
          createDefaultComponent('column', 'Coluna 2'),
        ],
      };

    case 'column':
      return {
        id,
        type: 'column',
        name: customName || 'Coluna',
        content: {},
        styles: {
          desktop: {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            customClasses: 'flex-1 w-full',
          },
        },
        parentId: null,
        children: [],
      };

    case 'grid':
      return {
        id,
        type: 'grid',
        name: customName || 'Grelha (Grid)',
        content: {},
        styles: {
          desktop: {
            display: 'grid',
            gridColumns: 'repeat(3, 1fr)',
            gap: '24px',
            customClasses: 'w-full grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
          },
        },
        parentId: null,
        children: [
          createDefaultComponent('card', 'Card 1'),
          createDefaultComponent('card', 'Card 2'),
          createDefaultComponent('card', 'Card 3'),
        ],
      };

    case 'heading':
      return {
        id,
        type: 'heading',
        name: customName || 'Título Principal',
        content: {
          text: 'Construa Algo Extraordinário Hoje',
          headingLevel: 'h2',
        },
        styles: {
          desktop: {
            fontSize: '36px',
            fontWeight: 'bold',
            lineHeight: '1.2',
            color: '#f8fafc',
            textAlign: 'left',
            fontFamily: 'Outfit',
            customClasses: 'tracking-tight',
          },
          mobile: {
            fontSize: '28px',
          },
        },
        parentId: null,
        children: [],
      };

    case 'text':
      return {
        id,
        type: 'text',
        name: customName || 'Parágrafo',
        content: {
          text: 'Desenvolvemos soluções digitais de alta performance que impulsionam o crescimento do seu negócio com rapidez, segurança e design de classe mundial.',
        },
        styles: {
          desktop: {
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#94a3b8',
            textAlign: 'left',
          },
        },
        parentId: null,
        children: [],
      };

    case 'button':
      return {
        id,
        type: 'button',
        name: customName || 'Botão de Ação',
        content: {
          text: 'Começar Agora',
          href: '#contacto',
          target: '_self',
          iconName: 'ArrowRight',
        },
        styles: {
          desktop: {
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            fontSize: '16px',
            fontWeight: '600',
            paddingTop: '14px',
            paddingBottom: '14px',
            paddingLeft: '28px',
            paddingRight: '28px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.4)',
            customClasses: 'inline-flex items-center justify-center gap-2 hover:opacity-90 transition-all transform hover:-translate-y-0.5 active:scale-95 cursor-pointer',
          },
        },
        parentId: null,
        children: [],
      };

    case 'image':
      return {
        id,
        type: 'image',
        name: customName || 'Imagem',
        content: {
          src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&auto=format&fit=crop&q=80',
          alt: 'Equipa de tecnologia WeHostHere em ação',
        },
        styles: {
          desktop: {
            width: '100%',
            borderRadius: '16px',
            borderWidth: '1px',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 35px -10px rgba(0, 0, 0, 0.5)',
            customClasses: 'object-cover aspect-video hover:scale-[1.01] transition-transform duration-300',
          },
        },
        parentId: null,
        children: [],
      };

    case 'icon':
      return {
        id,
        type: 'icon',
        name: customName || 'Ícone Lucide',
        content: {
          iconName: 'Sparkles',
        },
        styles: {
          desktop: {
            color: '#3b82f6',
            fontSize: '32px',
            paddingTop: '12px',
            paddingBottom: '12px',
            paddingLeft: '12px',
            paddingRight: '12px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '12px',
            customClasses: 'inline-flex items-center justify-center border border-blue-500/20',
          },
        },
        parentId: null,
        children: [],
      };

    case 'badge':
      return {
        id,
        type: 'badge',
        name: customName || 'Distintivo / Pill',
        content: {
          badgeText: 'âœ¨ NOVO LANÇAMENTO',
        },
        styles: {
          desktop: {
            color: '#60a5fa',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            borderColor: 'rgba(59, 130, 246, 0.3)',
            borderWidth: '1px',
            borderRadius: '9999px',
            paddingTop: '6px',
            paddingBottom: '6px',
            paddingLeft: '16px',
            paddingRight: '16px',
            fontSize: '13px',
            fontWeight: '600',
            customClasses: 'inline-flex items-center gap-1.5 w-fit uppercase tracking-wider',
          },
        },
        parentId: null,
        children: [],
      };

    case 'divider':
      return {
        id,
        type: 'divider',
        name: customName || 'Separador',
        content: {},
        styles: {
          desktop: {
            width: '100%',
            height: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            marginTop: '24px',
            marginBottom: '24px',
          },
        },
        parentId: null,
        children: [],
      };

    case 'spacer':
      return {
        id,
        type: 'spacer',
        name: customName || 'Espaçador',
        content: {},
        styles: {
          desktop: {
            height: '48px',
            width: '100%',
          },
        },
        parentId: null,
        children: [],
      };

    case 'card':
      return {
        id,
        type: 'card',
        name: customName || 'Card de Serviço',
        content: {
          iconName: 'Zap',
          headingLevel: 'h3',
          text: 'Hospedagem Ultrarrápida com NVMe e CDN Global que garante carregamentos em milissegundos para o seu site.',
          badgeText: 'Velocidade Extrema',
        },
        styles: {
          desktop: {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: '1px',
            borderRadius: '20px',
            paddingTop: '32px',
            paddingBottom: '32px',
            paddingLeft: '28px',
            paddingRight: '28px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
            customClasses: 'flex flex-col gap-4 backdrop-blur-md hover:border-blue-500/40 hover:-translate-y-1 transition-all duration-300',
          },
        },
        parentId: null,
        children: [],
      };

    case 'pricing-table':
      return {
        id,
        type: 'pricing-table',
        name: customName || 'Tabela de Preços',
        content: {
          pricingPlans: [
            {
              name: 'Iniciante',
              price: '1.500',
              currency: 'MT',
              cycle: '/mês',
              features: ['1 Website incluído', '10 GB Armazenamento SSD', 'Certificado SSL Grátis', 'Suporte por Email'],
              buttonText: 'Escolher Básico',
              buttonLink: '#contratar-iniciante',
            },
            {
              name: 'Profissional',
              price: '3.500',
              currency: 'MT',
              cycle: '/mês',
              badge: 'MAIS POPULAR',
              isPopular: true,
              features: ['5 Websites incluídos', '50 GB Armazenamento NVMe', 'Contas de Email Ilimitadas', 'Suporte Prioritário 24/7', 'Backups Automáticos'],
              buttonText: 'Contratar Profissional',
              buttonLink: '#contratar-pro',
            },
            {
              name: 'Empresarial',
              price: '7.900',
              currency: 'MT',
              cycle: '/mês',
              features: ['Websites Ilimitados', '200 GB Armazenamento NVMe', 'IP Dedicado Exclusivo', 'Gestor de Conta Pessoal', 'SLA 99.9% Garantido'],
              buttonText: 'Falar com Consultor',
              buttonLink: '#contratar-empresa',
            },
          ],
        },
        styles: {
          desktop: {
            width: '100%',
          },
        },
        parentId: null,
        children: [],
      };

    case 'features':
      return {
        id,
        type: 'features',
        name: customName || 'Destaques e Recursos',
        content: {
          features: [
            {
              iconName: 'ShieldCheck',
              title: 'Segurança de Nível Bancário',
              description: 'Proteção contra ataques DDoS, isolamento de contas e certificação SSL inclusa gratuitamente.',
            },
            {
              iconName: 'Cpu',
              title: 'Tecnologia de Ponta com IA',
              description: 'Otimização inteligente de recursos com servidores de última geração para máxima estabilidade.',
            },
            {
              iconName: 'Headphones',
              title: 'Suporte Humanizado 24/7',
              description: 'Nossa equipa de engenheiros está disponível a qualquer hora pelo WhatsApp e chat direto.',
            },
          ],
        },
        styles: {
          desktop: {
            width: '100%',
          },
        },
        parentId: null,
        children: [],
      };

    case 'testimonials':
      return {
        id,
        type: 'testimonials',
        name: customName || 'Depoimentos de Clientes',
        content: {
          testimonials: [
            {
              name: 'Dr. Lucas Silveira',
              role: 'Fundador da InovaTech',
              avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
              comment: 'Migramos todos os nossos servidores para a WeHostHere e a velocidade do nosso portal triplicou instantaneamente!',
              rating: 5,
            },
            {
              name: 'Dra. Beatriz Santos',
              role: 'Diretora de Marketing na Brandify',
              avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
              comment: 'O construtor com IA reduziu o tempo de lançamento das nossas landing pages de semanas para meros minutos.',
              rating: 5,
            },
          ],
        },
        styles: {
          desktop: {
            width: '100%',
          },
        },
        parentId: null,
        children: [],
      };

    case 'faq':
      return {
        id,
        type: 'faq',
        name: customName || 'Perguntas Frequentes',
        content: {
          faqItems: [
            {
              question: 'Como funciona a ativação imediata?',
              answer: 'Assim que a confirmação de pagamento for concluída, as credenciais e o acesso ao construtor são liberados no mesmo segundo.',
            },
            {
              question: 'Posso usar o meu domínio personalizado?',
              answer: 'Sim! Pode conectar qualquer domínio .com, .co.mz, .org ou utilizar gratuitamente o subdomínio da WeHostHere.',
            },
            {
              question: 'Como posso editar o meu site após a publicação?',
              answer: 'Basta aceder ao painel do builder, efetuar as alterações visuais que desejar ou pedir à IA e clicar em Atualizar.',
            },
          ],
        },
        styles: {
          desktop: {
            width: '100%',
          },
        },
        parentId: null,
        children: [],
      };

    case 'contact-form':
      return {
        id,
        type: 'contact-form',
        name: customName || 'Formulário de Contacto',
        content: {
          formSubmitText: 'Enviar Mensagem',
          formActionUrl: '#',
          formFields: [
            { id: 'name', label: 'Nome Completo', type: 'text', placeholder: 'Seu nome ou empresa', required: true },
            { id: 'email', label: 'Endereço de Email', type: 'email', placeholder: 'seuemail@exemplo.com', required: true },
            { id: 'phone', label: 'Contacto Telefónico / WhatsApp', type: 'tel', placeholder: '+258 84 000 0000', required: false },
            { id: 'message', label: 'Como podemos ajudar?', type: 'textarea', placeholder: 'Descreva resumidamente o seu projeto...', required: true },
          ],
        },
        styles: {
          desktop: {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: '1px',
            borderRadius: '24px',
            paddingTop: '36px',
            paddingBottom: '36px',
            paddingLeft: '32px',
            paddingRight: '32px',
            maxWidth: '640px',
            marginLeft: 'auto',
            marginRight: 'auto',
            customClasses: 'w-full shadow-2xl backdrop-blur-md',
          },
        },
        parentId: null,
        children: [],
      };

    case 'whatsapp-button':
      return {
        id,
        type: 'whatsapp-button',
        name: customName || 'Botão Flutuante WhatsApp',
        content: {
          text: 'Falar no WhatsApp',
          href: 'https://wa.me/258848335618?text=Olá!%20Gostaria%20de%20mais%20informações',
          target: '_blank',
          iconName: 'MessageCircle',
        },
        styles: {
          desktop: {
            backgroundColor: '#25D366',
            color: '#ffffff',
            fontSize: '15px',
            fontWeight: '600',
            paddingTop: '12px',
            paddingBottom: '12px',
            paddingLeft: '22px',
            paddingRight: '22px',
            borderRadius: '9999px',
            boxShadow: '0 8px 24px rgba(37, 211, 102, 0.35)',
            customClasses: 'inline-flex items-center justify-center gap-2.5 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer',
          },
        },
        parentId: null,
        children: [],
      };

    case 'navbar':
      return {
        id,
        type: 'navbar',
        name: customName || 'Navegação Superior',
        content: {
          text: 'WeHostHere',
          href: '/',
          iconName: 'Server',
        },
        styles: {
          desktop: {
            width: '100%',
            backgroundColor: 'rgba(10, 15, 29, 0.85)',
            borderBottomWidth: '1px',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            paddingTop: '16px',
            paddingBottom: '16px',
            paddingLeft: '24px',
            paddingRight: '24px',
            position: 'sticky',
            top: '0px',
            zIndex: 50,
            customClasses: 'backdrop-blur-md flex items-center justify-between',
          },
        },
        parentId: null,
        children: [],
      };

    case 'footer':
      return {
        id,
        type: 'footer',
        name: customName || 'Rodapé Principal',
        content: {
          text: 'Â© 2026 WeHostHere. Todos os direitos reservados. Hospedagem & Construtor com Inteligência Artificial.',
        },
        styles: {
          desktop: {
            width: '100%',
            backgroundColor: '#070a14',
            borderTopWidth: '1px',
            borderColor: 'rgba(255, 255, 255, 0.06)',
            paddingTop: '48px',
            paddingBottom: '48px',
            paddingLeft: '24px',
            paddingRight: '24px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: '14px',
          },
        },
        parentId: null,
        children: [],
      };

    case 'custom-html':
      return {
        id,
        type: 'custom-html',
        name: customName || 'Código HTML Customizado',
        content: {
          htmlRaw: '<div class="p-6 rounded-xl border border-dashed border-slate-700 text-center text-slate-400">Insira o seu código HTML personalizado ou widget aqui.</div>',
        },
        styles: {
          desktop: {
            width: '100%',
          },
        },
        parentId: null,
        children: [],
      };

    default:
      return {
        id,
        type,
        name: customName || `Elemento ${type}`,
        content: {},
        styles: { desktop: {} },
        parentId: null,
        children: [],
      };
  }
}

// â”€â”€â”€ Criação de uma Secção Hero Pré-configurada â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function createHeroSection(): VisualComponent {
  const section = createDefaultComponent('section', 'Secção Hero');
  const container = section.children[0];

  const badge = createDefaultComponent('badge', 'Badge de Destaque');
  badge.content.badgeText = 'ðŸš€ Plataforma de Hospedagem & IA WeHostHere';

  const heading = createDefaultComponent('heading', 'Título Hero');
  heading.content.text = 'O Seu Negócio Online com Velocidade e Estilo Incomparáveis';
  heading.styles.desktop.fontSize = '48px';
  heading.styles.desktop.textAlign = 'center';

  const paragraph = createDefaultComponent('text', 'Subtítulo Hero');
  paragraph.content.text = 'Crie páginas de alta conversão, publique com um clique e conquiste mais clientes com tecnologia de ponta e infraestrutura em nuvem dedicada.';
  paragraph.styles.desktop.fontSize = '18px';
  paragraph.styles.desktop.textAlign = 'center';
  paragraph.styles.desktop.maxWidth = '760px';
  paragraph.styles.desktop.marginLeft = 'auto';
  paragraph.styles.desktop.marginRight = 'auto';

  const rowButtons = createDefaultComponent('row', 'Linha de Botões');
  rowButtons.styles.desktop.justifyContent = 'center';
  rowButtons.children = [
    createDefaultComponent('button', 'Botão Começar Agora'),
    createDefaultComponent('whatsapp-button', 'Botão WhatsApp'),
  ];

  const imageHero = createDefaultComponent('image', 'Imagem de Destaque');
  imageHero.content.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80';
  imageHero.styles.desktop.maxWidth = '980px';
  imageHero.styles.desktop.marginLeft = 'auto';
  imageHero.styles.desktop.marginRight = 'auto';

  container.children = [badge, heading, paragraph, rowButtons, imageHero];
  return section;
}

// â”€â”€â”€ Documento Inicial Padrão (Full Working Site) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function createInitialSiteDocument(title = 'Meu Site Incrível', slug = 'meu-site'): SiteDocument {
  const heroSection = createHeroSection();

  // Secção de Benefícios
  const featuresSection = createDefaultComponent('section', 'Secção de Benefícios');
  const featuresContainer = featuresSection.children[0];
  const featHeading = createDefaultComponent('heading', 'Título de Benefícios');
  featHeading.content.text = 'Por Que Escolher a Nossa Solução';
  featHeading.content.headingLevel = 'h2';
  featHeading.styles.desktop.textAlign = 'center';
  const featComponent = createDefaultComponent('features', 'Lista de 3 Recursos');
  featuresContainer.children = [featHeading, featComponent];

  // Secção de Preços
  const pricingSection = createDefaultComponent('section', 'Secção de Preços');
  const pricingContainer = pricingSection.children[0];
  const priceHeading = createDefaultComponent('heading', 'Título Preços');
  priceHeading.content.text = 'Planos Simples e Transparentes';
  priceHeading.content.headingLevel = 'h2';
  priceHeading.styles.desktop.textAlign = 'center';
  const priceComponent = createDefaultComponent('pricing-table', 'Tabela de Preços');
  pricingContainer.children = [priceHeading, priceComponent];

  // Secção de Contacto
  const contactSection = createDefaultComponent('section', 'Secção de Contacto');
  const contactContainer = contactSection.children[0];
  const contactHeading = createDefaultComponent('heading', 'Título Contacto');
  contactHeading.content.text = 'Entre em Contacto Connosco';
  contactHeading.content.headingLevel = 'h2';
  contactHeading.styles.desktop.textAlign = 'center';
  const contactForm = createDefaultComponent('contact-form', 'Formulário');
  contactContainer.children = [contactHeading, contactForm];

  // Navbar e Rodapé
  const navbar = createDefaultComponent('navbar', 'Navegação');
  const footer = createDefaultComponent('footer', 'Rodapé');

  const homePage: PageDocument = {
    id: 'page_home',
    title: 'Página Inicial',
    slug: '/',
    seo: {
      metaTitle: `${title} | WeHostHere`,
      metaDescription: 'Website profissional construído com WeHostHere AI Builder.',
    },
    rootComponents: [
      navbar,
      heroSection,
      featuresSection,
      pricingSection,
      contactSection,
      footer,
    ],
  };

  return {
    version: 1,
    schemaVersion: '1.0',
    site: {
      id: `site_${Date.now()}`,
      name: title,
      slug,
      subdomain: slug,
      theme: DEFAULT_THEME,
    },
    activePageId: 'page_home',
    pages: [homePage],
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      builderVersion: '2.0.0-elementor-preview',
    },
  };
}

