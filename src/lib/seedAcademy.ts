import { dataManager, Course, Module, Lesson } from '@/lib/data';

export async function seedAcademyData() {
  console.log('A criar dados iniciais da Academia Web...');

  // Criar o curso principal
  const course = dataManager.createCourse({
    title: 'Criação de Página de Vendas Profissional',
    shortDescription: 'Aprenda a criar páginas de vendas que convertem visitantes em clientes',
    description: 'Neste curso completo, você aprenderá todas as técnicas e estratégias para criar páginas de vendas profissionais que realmente convertem. Desde a estrutura até o copywriting, passando pelo design e otimização.',
    duration: '8 horas',
    outcome: 'Será capaz de criar páginas de vendas profissionais do zero',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
    accessType: 'free',
    order: 1,
    active: true
  });

  console.log('Curso criado:', course.id);

  // Criar módulos
  const modules = [
    {
      title: 'Introdução às Páginas de Vendas',
      description: 'Fundamentos e conceitos essenciais sobre páginas de vendas',
      objective: 'Compreender o que é uma página de vendas e sua importância',
      order: 1
    },
    {
      title: 'Estrutura de uma Página de Vendas',
      description: 'Elementos essenciais e organização do conteúdo',
      objective: 'Dominar a estrutura ideal de uma página de vendas',
      order: 2
    },
    {
      title: 'Copywriting para Vendas',
      description: 'Técnicas de escrita persuasiva',
      objective: 'Aprender a escrever textos que vendem',
      order: 3
    },
    {
      title: 'Design e Visual',
      description: 'Princípios de design para páginas de vendas',
      objective: 'Criar designs atraentes e funcionais',
      order: 4
    },
    {
      title: 'Elementos de Conversão',
      description: 'CTAs, formulários e elementos que aumentam conversão',
      objective: 'Implementar elementos que maximizam a conversão',
      order: 5
    },
    {
      title: 'Otimização e Testes',
      description: 'A/B testing e otimização contínua',
      objective: 'Otimizar a página para melhores resultados',
      order: 6
    },
    {
      title: 'Integrações e Automações',
      description: 'Ferramentas e integrações essenciais',
      objective: 'Conectar a página com ferramentas de marketing',
      order: 7
    },
    {
      title: 'Lançamento e Monitoramento',
      description: 'Estratégias de lançamento e métricas',
      objective: 'Lançar e monitorar o desempenho da página',
      order: 8
    }
  ];

  const createdModules = modules.map((mod, index) => {
    const courseModule = dataManager.createModule({
      courseId: course.id,
      ...mod,
      active: true
    });
    console.log(`Módulo ${index + 1} criado:`, courseModule.id);
    return courseModule;
  });

  // Criar lições para cada módulo
  const lessonsData = [
    // Módulo 1
    [
      {
        title: 'O que é uma Página de Vendas?',
        content: 'Uma página de vendas é uma página web desenhada especificamente para converter visitantes em clientes. Diferente de uma página institucional, a página de vendas tem um objetivo claro: levar o visitante a realizar uma ação específica, geralmente uma compra.\n\nNesta lição, vamos explorar:\n- Definição de página de vendas\n- Diferença entre página de vendas e site institucional\n- Importância das páginas de vendas no marketing digital\n- Exemplos de páginas de vendas bem-sucedidas',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        videoTitle: 'Introdução às Páginas de Vendas',
        videoDescription: 'Vídeo explicativo sobre o conceito de páginas de vendas',
        hasMaterial: true,
        materialUrl: 'https://example.com/material-mod1-licao1.pdf',
        materialTitle: 'Guia de Introdução às Páginas de Vendas',
        materialType: 'pdf' as const,
        order: 1
      },
      {
        title: 'Por que Páginas de Vendas são Importantes?',
        content: 'As páginas de vendas são cruciais para o sucesso de qualquer negócio online. Elas permitem:\n\n1. Focar em um único objetivo\n2. Eliminar distrações\n3. Personalizar a mensagem para o público-alvo\n4. Facilitar a tomada de decisão\n5. Aumentar as taxas de conversão\n\nEstudos mostram que páginas de vendas bem projetadas podem aumentar as conversões em até 300%.',
        hasVideo: false,
        hasMaterial: false,
        order: 2
      }
    ],
    // Módulo 2
    [
      {
        title: 'Anatomia de uma Página de Vendas',
        content: 'Uma página de vendas eficaz tem uma estrutura específica:\n\n1. **Headline** - Título principal que captura a atenção\n2. **Subheadline** - Complementa e expande a headline\n3. **Hero Section** - Seção principal com imagem/video\n4. **Problema** - Identifica o problema do cliente\n5. **Solução** - Apresenta sua solução\n6. **Benefícios** - Lista os benefícios do produto/serviço\n7. **Prova Social** - Testemunhos, casos de sucesso\n8. **CTA** - Call-to-action claro e visível\n9. **FAQ** - Perguntas frequentes\n10. **Footer** - Informações adicionais e links',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        videoTitle: 'Anatomia de uma Página de Vendas',
        hasMaterial: true,
        materialUrl: 'https://example.com/checklist-estrutura.pdf',
        materialTitle: 'Checklist de Estrutura',
        materialType: 'pdf' as const,
        order: 1
      }
    ],
    // Módulo 3
    [
      {
        title: 'Fundamentos de Copywriting',
        content: 'Copywriting é a arte de escrever textos que vendem. Princípios fundamentais:\n\n1. **Conheça seu público** - Entenda suas dores e desejos\n2. **Foque em benefícios, não características** - O que o produto faz PELO cliente\n3. **Use gatilhos mentais** - Escassez, urgência, autoridade\n4. **Seja claro e direto** - Evite jargões e complexidade\n5. **Use prova social** - Testemunhos e números\n6. **Crie urgência** - Dê motivos para agir agora',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        videoTitle: 'Fundamentos de Copywriting',
        hasMaterial: true,
        materialUrl: 'https://example.com/gatilhos-mentais.pdf',
        materialTitle: 'Gatilhos Mentais para Vendas',
        materialType: 'pdf' as const,
        order: 1
      },
      {
        title: 'Escrevendo Headlines que Vendem',
        content: 'A headline é o elemento mais importante da sua página. Técnicas:\n\n1. **Use números** - "7 técnicas para..." funciona melhor que "Técnicas para..."\n2. **Faça perguntas** - "Você está cometendo este erro?"\n3. **Use "Como"** - "Como aumentar suas vendas em 30 dias"\n4. **Seja específico** - Evite generalizações\n5. **Teste sempre** - Faça A/B testing das suas headlines',
        hasVideo: false,
        hasMaterial: false,
        order: 2
      }
    ],
    // Módulo 4
    [
      {
        title: 'Princípios de Design para Páginas de Vendas',
        content: 'O design da sua página de vendas deve:\n\n1. **Ser limpo e organizado** - Espaço em branco é seu amigo\n2. **Usar hierarquia visual** - Guie o olhar do visitante\n3. **Ter cores estratégicas** - Use cores que evocam as emoções certas\n4. **Ser responsivo** - Funcione em todos os dispositivos\n5. **Carregar rápido** - Performance afeta conversão\n6. **Usar imagens de qualidade** - Imagens profissionais aumentam credibilidade',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        videoTitle: 'Design de Páginas de Vendas',
        hasMaterial: true,
        materialUrl: 'https://example.com/paleta-cores.pdf',
        materialTitle: 'Paletas de Cores para Vendas',
        materialType: 'pdf' as const,
        order: 1
      }
    ],
    // Módulo 5
    [
      {
        title: 'Call-to-Actions Eficazes',
        content: 'Um CTA eficaz deve:\n\n1. **Ser claro** - O usuário sabe exatamente o que vai acontecer\n2. **Ser visível** - Destaque visualmente\n3. **Usar verbos de ação** - "Comprar", "Baixar", "Inscrever"\n4. **Criar urgência** - "Oferta limitada", "Só hoje"\n5. **Estar acima da dobra** - Visível sem scroll\n6. **Ser repetido** - Apareça em múltiplos pontos da página\n\nExemplos de CTAs:\n- "Quero Começar Agora"\n- "Baixar Guia Grátis"\n- "Garantir Minha Vaga"',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        videoTitle: 'Criando CTAs que Convertem',
        hasMaterial: false,
        order: 1
      },
      {
        title: 'Formulários que Convertem',
        content: 'Formulários devem ser:\n\n1. **Simples** - Peça apenas o essencial\n2. **Curto** - Menos campos = mais conversões\n3. **Claro** - Labels explicativos\n4. **Com validação** - Feedback imediato\n5. **Com CTA forte** - Botão de submit destacado\n\nMelhores práticas:\n- Use campos obrigatórios apenas quando necessário\n- Oferece valor em troca (lead magnet)\n- Mostre progresso em formulários longos\n- Use autocomplete quando possível',
        hasVideo: false,
        hasMaterial: true,
        materialUrl: 'https://example.com/checklist-formularios.pdf',
        materialTitle: 'Checklist de Formulários',
        materialType: 'pdf' as const,
        order: 2
      }
    ],
    // Módulo 6
    [
      {
        title: 'Introdução ao A/B Testing',
        content: 'A/B testing é essencial para otimizar suas páginas:\n\n**O que testar:**\n- Headlines\n- CTAs\n- Cores\n- Imagens\n- Layout\n- Copy\n\n**Como fazer:**\n1. Defina uma hipótese\n2. Crie duas versões\n3. Teste simultaneamente\n4. Colete dados\n5. Analise resultados\n6. Implemente o vencedor\n\n**Ferramentas:**\n- Google Optimize\n- Optimizely\n- VWO\n- Hotjar',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        videoTitle: 'A/B Testing para Páginas de Vendas',
        hasMaterial: true,
        materialUrl: 'https://example.com/guia-ab-testing.pdf',
        materialTitle: 'Guia Completo de A/B Testing',
        materialType: 'pdf' as const,
        order: 1
      }
    ],
    // Módulo 7
    [
      {
        title: 'Ferramentas Essenciais',
        content: 'Ferramentas recomendadas para páginas de vendas:\n\n**Construtores de Páginas:**\n- Unbounce\n- Leadpages\n- Instapage\n- ClickFunnels\n\n**Email Marketing:**\n- Mailchimp\n- ConvertKit\n- ActiveCampaign\n\n**Analytics:**\n- Google Analytics\n- Hotjar\n- Crazy Egg\n\n**Automação:**\n- Zapier\n- Make (Integromat)\n- IFTTT',
        hasVideo: false,
        hasMaterial: true,
        materialUrl: 'https://example.com/ferramentas-essenciais.pdf',
        materialTitle: 'Lista de Ferramentas',
        materialType: 'pdf' as const,
        order: 1
      },
      {
        title: 'Integrando com Email Marketing',
        content: 'Integração com email marketing é crucial:\n\n1. **Capture leads** - Use formulários para capturar emails\n2. **Segmentação** - Separe leads por interesse\n3. **Automação** - Sequências de email automáticas\n4. **Nutrição** - Eduque leads antes de vender\n5. **Remarketing** - Retargeting de não-conversores\n\n**Melhores práticas:**\n- Ofereça lead magnet de qualidade\n- Use double opt-in quando possível\n- Respeite a privacidade (LGPD)\n- Teste diferentes assuntos de email',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        videoTitle: 'Integração com Email Marketing',
        hasMaterial: false,
        order: 2
      }
    ],
    // Módulo 8
    [
      {
        title: 'Estratégias de Lançamento',
        content: 'Estratégias eficazes de lançamento:\n\n1. **Pré-lançamento** - Crie antecipação\n2. **Lista de espera** - Capture interessados\n3. **Contagem regressiva** - Crie urgência\n4. **Webinar de lançamento** - Apresente ao vivo\n5. **Bônus limitados** - Incentive ação rápida\n6. **Prova social** - Use early adopters\n\n**Cronograma típico:**\n- 2 semanas antes: Anúncio pré-lançamento\n- 1 semana antes: Lista de espera\n- Dia do lançamento: Evento ao vivo\n- Pós-lançamento: Follow-up e suporte',
        hasVideo: true,
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        videoTitle: 'Estratégias de Lançamento',
        hasMaterial: true,
        materialUrl: 'https://example.com/cronograma-lancamento.pdf',
        materialTitle: 'Template de Cronograma',
        materialType: 'pdf' as const,
        order: 1
      },
      {
        title: 'Métricas e KPIs',
        content: 'Métricas importantes para monitorar:\n\n**Métricas de Conversão:**\n- Taxa de conversão geral\n- Taxa de conversão por fonte\n- Custo por aquisição (CPA)\n- Valor do cliente (LTV)\n\n**Métricas de Engajamento:**\n- Tempo na página\n- Taxa de rejeição\n- Páginas por sessão\n- Scroll depth\n\n**Métricas de Vendas:**\n- Receita total\n- Ticket médio\n- Taxa de abandono de carrinho\n\n**Ferramentas de análise:**\n- Google Analytics\n- Facebook Pixel\n- Hotjar\n- Google Tag Manager',
        hasVideo: false,
        hasMaterial: true,
        materialUrl: 'https://example.com/dashboard-metricas.pdf',
        materialTitle: 'Template de Dashboard',
        materialType: 'pdf' as const,
        order: 2
      }
    ]
  ];

  lessonsData.forEach((moduleLessons, moduleIndex) => {
    const courseModule = createdModules[moduleIndex];
    moduleLessons.forEach((lessonData, lessonIndex) => {
      const lesson = dataManager.createLesson({
        moduleId: courseModule.id,
        ...lessonData,
        active: true
      });
      console.log(`Lição ${lessonIndex + 1} do módulo ${moduleIndex + 1} criada:`, lesson.id);
    });
  });

  console.log('Dados da Academia Web criados com sucesso!');
  console.log('Curso ID:', course.id);
  console.log('Total de módulos:', createdModules.length);
  
  let totalLessons = 0;
  createdModules.forEach(mod => {
    totalLessons += dataManager.getLessons(mod.id).length;
  });
  console.log('Total de lições:', totalLessons);

  return course;
}

// Função para executar o seed no browser
if (typeof window !== 'undefined') {
  (window as any).seedAcademyData = seedAcademyData;
}
