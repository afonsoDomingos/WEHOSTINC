// ============================================================================
// ðŸŽ¨ WEHOSTHERE VISUAL BUILDER â€” COMPONENTES PADRÃƒO & BIBLIOTECA ELEMENTOR-LIKE
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
  { type: 'section', title: 'SecÃ§Ã£o', category: 'layout', icon: 'Layout', description: 'Bloco de largura total com container centrado' },
  { type: 'container', title: 'Container', category: 'layout', icon: 'Box', description: 'Caixa de conteÃºdo com largura mÃ¡xima' },
  { type: 'grid', title: 'Grelha (Grid)', category: 'layout', icon: 'Grid3X3', description: 'DistribuiÃ§Ã£o em colunas responsivas' },
  { type: 'row', title: 'Linha Flex', category: 'layout', icon: 'Rows', description: 'Linha horizontal flexÃ­vel com espaÃ§amento' },
  { type: 'column', title: 'Coluna', category: 'layout', icon: 'Columns', description: 'Coluna vertical flexÃ­vel' },
  { type: 'navbar', title: 'Menu Superior', category: 'layout', icon: 'Navigation', description: 'Barra de navegaÃ§Ã£o com logotipo e links' },
  { type: 'footer', title: 'RodapÃ©', category: 'layout', icon: 'PanelBottom', description: 'RodapÃ© com links, direitos e redes sociais' },

  // ConteÃºdo BÃ¡sico
  { type: 'heading', title: 'TÃ­tulo', category: 'basic', icon: 'Heading', description: 'TÃ­tulos H1 a H6 com tipografia expressiva' },
  { type: 'text', title: 'Texto / ParÃ¡grafo', category: 'basic', icon: 'AlignLeft', description: 'Bloco de texto com formataÃ§Ã£o visual' },
  { type: 'button', title: 'BotÃ£o CTA', category: 'basic', icon: 'MousePointerClick', description: 'BotÃ£o de aÃ§Ã£o clicÃ¡vel com variantes de estilo' },
  { type: 'image', title: 'Imagem', category: 'basic', icon: 'Image', description: 'Imagem responsiva com cantos arredondados' },
  { type: 'icon', title: 'Ãcone', category: 'basic', icon: 'Sparkles', description: 'Ãcone Lucide com cor e tamanho ajustÃ¡veis' },
  { type: 'badge', title: 'Distintivo / Pill', category: 'basic', icon: 'Tag', description: 'Etiqueta compacta para destacar novidades' },
  { type: 'divider', title: 'Separador', category: 'basic', icon: 'Minus', description: 'Linha divisÃ³ria sutil com gradiente' },
  { type: 'spacer', title: 'EspaÃ§ador', category: 'basic', icon: 'MoveVertical', description: 'EspaÃ§o em branco para respiro visual' },

  // Blocos Compostos
  { type: 'card', title: 'Card de Destaque', category: 'blocks', icon: 'SquareCode', description: 'Card com Ã­cone, tÃ­tulo, descriÃ§Ã£o e link' },
  { type: 'features', title: '3 BenefÃ­cios', category: 'blocks', icon: 'CheckCircle2', description: 'Grelha de 3 recursos com Ã­cones modernos' },
  { type: 'pricing-table', title: 'Tabela de PreÃ§os', category: 'blocks', icon: 'CreditCard', description: 'Planos comparativos com plano destaque' },
  { type: 'testimonials', title: 'Depoimentos', category: 'blocks', icon: 'Quote', description: 'AvaliaÃ§Ãµes de clientes com estrelas e fotos' },
  { type: 'faq', title: 'Perguntas Frequentes', category: 'blocks', icon: 'HelpCircle', description: 'Lista de FAQ com respostas em acordeÃ£o' },
  { type: 'contact-form', title: 'FormulÃ¡rio', category: 'blocks', icon: 'Mail', description: 'FormulÃ¡rio de contacto com validaÃ§Ã£o' },
  { type: 'whatsapp-button', title: 'BotÃ£o WhatsApp', category: 'blocks', icon: 'MessageCircle', description: 'BotÃ£o com link direto para conversa no WhatsApp' },
  { type: 'custom-html', title: 'HTML Livre', category: 'blocks', icon: 'Code', description: 'Bloco de cÃ³digo livre para embeds ou widgets' },
];

// â”€â”€â”€ Tema Global PadrÃ£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ FÃ¡brica de Componentes PadrÃ£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function createDefaultComponent(type: ComponentType, customName?: string): VisualComponent {
  const id = generateComponentId(type);

  switch (type) {
    case 'hero':
      return createHeroSection();

    case 'section':
      return {
        id,
        type: 'section',
        name: customName || 'SecÃ§Ã£o',
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
          createDefaultComponent('container', 'Container da SecÃ§Ã£o'),
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
        name: customName || 'Linha FlexÃ­vel',
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
        name: customName || 'TÃ­tulo Principal',
        content: {
          text: 'Construa Algo ExtraordinÃ¡rio Hoje',
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
        name: customName || 'ParÃ¡grafo',
        content: {
          text: 'Desenvolvemos soluÃ§Ãµes digitais de alta performance que impulsionam o crescimento do seu negÃ³cio com rapidez, seguranÃ§a e design de classe mundial.',
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
        name: customName || 'BotÃ£o de AÃ§Ã£o',
        content: {
          text: 'ComeÃ§ar Agora',
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
          alt: 'Equipa de tecnologia WeHostHere em aÃ§Ã£o',
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
        name: customName || 'Ãcone Lucide',
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
          badgeText: 'âœ¨ NOVO LANÃ‡AMENTO',
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
        name: customName || 'EspaÃ§ador',
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
        name: customName || 'Card de ServiÃ§o',
        content: {
          iconName: 'Zap',
          headingLevel: 'h3',
          text: 'Hospedagem UltrarrÃ¡pida com NVMe e CDN Global que garante carregamentos em milissegundos para o seu site.',
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
        name: customName || 'Tabela de PreÃ§os',
        content: {
          pricingPlans: [
            {
              name: 'Iniciante',
              price: '1.500',
              currency: 'MT',
              cycle: '/mÃªs',
              features: ['1 Website incluÃ­do', '10 GB Armazenamento SSD', 'Certificado SSL GrÃ¡tis', 'Suporte por Email'],
              buttonText: 'Escolher BÃ¡sico',
              buttonLink: '#contratar-iniciante',
            },
            {
              name: 'Profissional',
              price: '3.500',
              currency: 'MT',
              cycle: '/mÃªs',
              badge: 'MAIS POPULAR',
              isPopular: true,
              features: ['5 Websites incluÃ­dos', '50 GB Armazenamento NVMe', 'Contas de Email Ilimitadas', 'Suporte PrioritÃ¡rio 24/7', 'Backups AutomÃ¡ticos'],
              buttonText: 'Contratar Profissional',
              buttonLink: '#contratar-pro',
            },
            {
              name: 'Empresarial',
              price: '7.900',
              currency: 'MT',
              cycle: '/mÃªs',
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
              title: 'SeguranÃ§a de NÃ­vel BancÃ¡rio',
              description: 'ProteÃ§Ã£o contra ataques DDoS, isolamento de contas e certificaÃ§Ã£o SSL inclusa gratuitamente.',
            },
            {
              iconName: 'Cpu',
              title: 'Tecnologia de Ponta com IA',
              description: 'OtimizaÃ§Ã£o inteligente de recursos com servidores de Ãºltima geraÃ§Ã£o para mÃ¡xima estabilidade.',
            },
            {
              iconName: 'Headphones',
              title: 'Suporte Humanizado 24/7',
              description: 'Nossa equipa de engenheiros estÃ¡ disponÃ­vel a qualquer hora pelo WhatsApp e chat direto.',
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
              comment: 'O construtor com IA reduziu o tempo de lanÃ§amento das nossas landing pages de semanas para meros minutos.',
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
              question: 'Como funciona a ativaÃ§Ã£o imediata?',
              answer: 'Assim que a confirmaÃ§Ã£o de pagamento for concluÃ­da, as credenciais e o acesso ao construtor sÃ£o liberados no mesmo segundo.',
            },
            {
              question: 'Posso usar o meu domÃ­nio personalizado?',
              answer: 'Sim! Pode conectar qualquer domÃ­nio .com, .co.mz, .org ou utilizar gratuitamente o subdomÃ­nio da WeHostHere.',
            },
            {
              question: 'Como posso editar o meu site apÃ³s a publicaÃ§Ã£o?',
              answer: 'Basta aceder ao painel do builder, efetuar as alteraÃ§Ãµes visuais que desejar ou pedir Ã  IA e clicar em Atualizar.',
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
        name: customName || 'FormulÃ¡rio de Contacto',
        content: {
          formSubmitText: 'Enviar Mensagem',
          formActionUrl: '#',
          formFields: [
            { id: 'name', label: 'Nome Completo', type: 'text', placeholder: 'Seu nome ou empresa', required: true },
            { id: 'email', label: 'EndereÃ§o de Email', type: 'email', placeholder: 'seuemail@exemplo.com', required: true },
            { id: 'phone', label: 'Contacto TelefÃ³nico / WhatsApp', type: 'tel', placeholder: '+258 84 000 0000', required: false },
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
        name: customName || 'BotÃ£o Flutuante WhatsApp',
        content: {
          text: 'Falar no WhatsApp',
          href: 'https://wa.me/258848335618?text=OlÃ¡!%20Gostaria%20de%20mais%20informaÃ§Ãµes',
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
        name: customName || 'NavegaÃ§Ã£o Superior',
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
        name: customName || 'RodapÃ© Principal',
        content: {
          text: 'Â© 2026 WeHostHere. Todos os direitos reservados. Hospedagem & Construtor com InteligÃªncia Artificial.',
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
        name: customName || 'CÃ³digo HTML Customizado',
        content: {
          htmlRaw: '<div class="p-6 rounded-xl border border-dashed border-slate-700 text-center text-slate-400">Insira o seu cÃ³digo HTML personalizado ou widget aqui.</div>',
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

// â”€â”€â”€ CriaÃ§Ã£o de uma SecÃ§Ã£o Hero PrÃ©-configurada â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function createHeroSection(): VisualComponent {
  const section = createDefaultComponent('section', 'SecÃ§Ã£o Hero');
  const container = section.children[0];

  const badge = createDefaultComponent('badge', 'Badge de Destaque');
  badge.content.badgeText = 'ðŸš€ Plataforma de Hospedagem & IA WeHostHere';

  const heading = createDefaultComponent('heading', 'TÃ­tulo Hero');
  heading.content.text = 'O Seu NegÃ³cio Online com Velocidade e Estilo IncomparÃ¡veis';
  heading.styles.desktop.fontSize = '48px';
  heading.styles.desktop.textAlign = 'center';

  const paragraph = createDefaultComponent('text', 'SubtÃ­tulo Hero');
  paragraph.content.text = 'Crie pÃ¡ginas de alta conversÃ£o, publique com um clique e conquiste mais clientes com tecnologia de ponta e infraestrutura em nuvem dedicada.';
  paragraph.styles.desktop.fontSize = '18px';
  paragraph.styles.desktop.textAlign = 'center';
  paragraph.styles.desktop.maxWidth = '760px';
  paragraph.styles.desktop.marginLeft = 'auto';
  paragraph.styles.desktop.marginRight = 'auto';

  const rowButtons = createDefaultComponent('row', 'Linha de BotÃµes');
  rowButtons.styles.desktop.justifyContent = 'center';
  rowButtons.children = [
    createDefaultComponent('button', 'BotÃ£o ComeÃ§ar Agora'),
    createDefaultComponent('whatsapp-button', 'BotÃ£o WhatsApp'),
  ];

  const imageHero = createDefaultComponent('image', 'Imagem de Destaque');
  imageHero.content.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80';
  imageHero.styles.desktop.maxWidth = '980px';
  imageHero.styles.desktop.marginLeft = 'auto';
  imageHero.styles.desktop.marginRight = 'auto';

  container.children = [badge, heading, paragraph, rowButtons, imageHero];
  return section;
}

// â”€â”€â”€ Documento Inicial PadrÃ£o (Full Working Site) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function createInitialSiteDocument(title = 'Meu Site IncrÃ­vel', slug = 'meu-site'): SiteDocument {
  const heroSection = createHeroSection();

  // SecÃ§Ã£o de BenefÃ­cios
  const featuresSection = createDefaultComponent('section', 'SecÃ§Ã£o de BenefÃ­cios');
  const featuresContainer = featuresSection.children[0];
  const featHeading = createDefaultComponent('heading', 'TÃ­tulo de BenefÃ­cios');
  featHeading.content.text = 'Por Que Escolher a Nossa SoluÃ§Ã£o';
  featHeading.content.headingLevel = 'h2';
  featHeading.styles.desktop.textAlign = 'center';
  const featComponent = createDefaultComponent('features', 'Lista de 3 Recursos');
  featuresContainer.children = [featHeading, featComponent];

  // SecÃ§Ã£o de PreÃ§os
  const pricingSection = createDefaultComponent('section', 'SecÃ§Ã£o de PreÃ§os');
  const pricingContainer = pricingSection.children[0];
  const priceHeading = createDefaultComponent('heading', 'TÃ­tulo PreÃ§os');
  priceHeading.content.text = 'Planos Simples e Transparentes';
  priceHeading.content.headingLevel = 'h2';
  priceHeading.styles.desktop.textAlign = 'center';
  const priceComponent = createDefaultComponent('pricing-table', 'Tabela de PreÃ§os');
  pricingContainer.children = [priceHeading, priceComponent];

  // SecÃ§Ã£o de Contacto
  const contactSection = createDefaultComponent('section', 'SecÃ§Ã£o de Contacto');
  const contactContainer = contactSection.children[0];
  const contactHeading = createDefaultComponent('heading', 'TÃ­tulo Contacto');
  contactHeading.content.text = 'Entre em Contacto Connosco';
  contactHeading.content.headingLevel = 'h2';
  contactHeading.styles.desktop.textAlign = 'center';
  const contactForm = createDefaultComponent('contact-form', 'FormulÃ¡rio');
  contactContainer.children = [contactHeading, contactForm];

  // Navbar e RodapÃ©
  const navbar = createDefaultComponent('navbar', 'NavegaÃ§Ã£o');
  const footer = createDefaultComponent('footer', 'RodapÃ©');

  const homePage: PageDocument = {
    id: 'page_home',
    title: 'PÃ¡gina Inicial',
    slug: '/',
    seo: {
      metaTitle: `${title} | WeHostHere`,
      metaDescription: 'Website profissional construÃ­do com WeHostHere AI Builder.',
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

