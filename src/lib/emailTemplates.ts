export interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  icon: string;
}

export const emailTemplates: EmailTemplate[] = [
  // CATEGORIA: Boas-vindas
  {
    id: 'welcome',
    name: 'Boas-vindas',
    category: 'Boas-vindas',
    subject: 'Bem-vindo à nossa plataforma!',
    body: `Olá {nome},

É com grande satisfação que lhe damos as boas-vindas à nossa plataforma!

A sua conta foi criada com sucesso e já pode começar a aproveitar todos os nossos serviços.

Próximos passos:
- Complete o seu perfil
- Explore as funcionalidades disponíveis
- Entre em contacto conosco se precisar de ajuda

Se tiver alguma dúvida, não hesite em contactar a nossa equipa de suporte.

Com os melhores cumprimentos,
{seu_nome}
{sua_empresa}`,
    icon: '🎉'
  },
  {
    id: 'welcome-client',
    name: 'Boas-vindas Cliente',
    category: 'Boas-vindas',
    subject: 'Obrigado por se juntar a nós!',
    body: `Caro(a) {nome},

Muito obrigado por escolher os nossos serviços! É um privilégio ter você como cliente.

A sua conta foi ativada e já pode começar a utilizar todos os benefícios do seu plano.

Informações importantes:
- Plano: {plano}
- Data de início: {data_inicio}
- Próxima fatura: {data_fatura}

Estamos à sua disposição para qualquer questão.

Atenciosamente,
{seu_nome}
{seua_empresa}`,
    icon: '🤝'
  },

  // CATEGORIA: Vendas
  {
    id: 'quote-request',
    name: 'Solicitação de Orçamento',
    category: 'Vendas',
    subject: 'Solicitação de Orçamento - {projeto}',
    body: `Prezados(as),

Gostaria de solicitar um orçamento para o seguinte projeto:

**Detalhes do Projeto:**
- Tipo: {tipo_projeto}
- Descrição: {descricao}
- Prazo desejado: {prazo}
- Orçamento estimado: {orcamento}

**Requisitos específicos:**
{requisitos}

Aguardo o retorno com o orçamento detalhado.

Atenciosamente,
{seu_nome}
{seu_telefone}`,
    icon: '💰'
  },
  {
    id: 'quote-response',
    name: 'Resposta de Orçamento',
    category: 'Vendas',
    subject: 'Orçamento para {projeto}',
    body: `Caro(a) {nome},

Agradeço o seu interesse nos nossos serviços. Segue abaixo o orçamento solicitado:

**Orçamento #{numero_orcamento}**
- Projeto: {projeto}
- Valor total: {valor} MT
- Prazo de entrega: {prazo}
- Validade: {validade}

**Detalhamento:**
{detalhamento}

Este orçamento é válido por {dias_validade} dias.

Fico à disposição para esclarecimentos.

Com os melhores cumprimentos,
{seu_nome}
{sua_empresa}`,
    icon: '📋'
  },
  {
    id: 'follow-up',
    name: 'Follow-up Vendas',
    category: 'Vendas',
    subject: 'Seguimento - {projeto}',
    body: `Olá {nome},

Espero que esteja bem!

Gostaria de fazer um seguimento sobre a nossa última conversa referente ao {projeto}.

Algum progresso desde então? Tem alguma dúvida ou precisa de informações adicionais?

Estou à disposição para ajudar no que for necessário.

Atenciosamente,
{seu_nome}`,
    icon: '📞'
  },

  // CATEGORIA: Suporte
  {
    id: 'support-ticket',
    name: 'Abertura de Ticket',
    category: 'Suporte',
    subject: 'Ticket #{numero} - {assunto}',
    body: `Prezado(a) Suporte,

Gostaria de reportar o seguinte problema:

**Descrição do Problema:**
{descricao}

**Informações Técnicas:**
- Sistema: {sistema}
- Versão: {versao}
- Navegador: {navegador}
- Data/hora: {data_hora}

**Passos para reproduzir:**
{passos}

Aguardo uma resposta o mais breve possível.

Obrigado(a),
{seu_nome}`,
    icon: '🎫'
  },
  {
    id: 'support-response',
    name: 'Resposta de Suporte',
    category: 'Suporte',
    subject: 'Resolução do Ticket #{numero}',
    body: `Caro(a) {nome},

O seu ticket #{numero} foi resolvido com sucesso!

**Resumo:**
{resumo}

**Solução aplicada:**
{solucao}

Se tiver alguma dúvida ou o problema persistir, por favor responda a este email.

Agradecemos a sua paciência e compreensão.

Atenciosamente,
Equipa de Suporte
{sua_empresa}`,
    icon: '✅'
  },

  // CATEGORIA: Reuniões
  {
    id: 'meeting-invite',
    name: 'Convite de Reunião',
    category: 'Reuniões',
    subject: 'Convite para Reunião: {assunto}',
    body: `Olá {nome},

Gostaria de convidá-lo(a) para uma reunião sobre {assunto}.

**Detalhes da Reunião:**
- Data: {data}
- Horário: {horario}
- Duração: {duracao}
- Local: {local}
- Link: {link}

**Pauta:**
{pauta}

Por favor confirme a sua presença até {data_confirmacao}.

Atenciosamente,
{seu_nome}`,
    icon: '📅'
  },
  {
    id: 'meeting-reminder',
    name: 'Lembrete de Reunião',
    category: 'Reuniões',
    subject: 'Lembrete: Reunião às {horario}',
    body: `Olá {nome},

Este é um lembrete para a reunião agendada para hoje às {horario}.

**Detalhes:**
- Assunto: {assunto}
- Link: {link}
- Local: {local}

Por favor prepare-se com antecedência.

Atenciosamente,
{seu_nome}`,
    icon: '⏰'
  },

  // CATEGORIA: Notificações
  {
    id: 'maintenance-notice',
    name: 'Aviso de Manutenção',
    category: 'Notificações',
    subject: 'Aviso de Manutenção Programada',
    body: `Prezado(a) Cliente,

Informamos que realizaremos uma manutenção programada em nossos sistemas.

**Detalhes da Manutenção:**
- Data: {data}
- Horário: {horario_inicio} às {horario_fim}
- Duração estimada: {duracao}
- Serviços afetados: {servicos}

Durante este período, os serviços mencionados poderão sofrer interrupções temporárias.

Pedimos desculpas pelo inconveniente e agradecemos a sua compreensão.

Atenciosamente,
Equipa Técnica
{sua_empresa}`,
    icon: '🔧'
  },
  {
    id: 'invoice-sent',
    name: 'Envio de Fatura',
    category: 'Notificações',
    subject: 'Fatura #{numero} - {mes}',
    body: `Caro(a) {nome},

Enviamos em anexo a fatura referente ao mês de {mes}.

**Detalhes da Fatura:**
- Número: {numero}
- Valor: {valor} MT
- Data de vencimento: {vencimento}
- Referência de pagamento: {referencia}

**Serviços faturados:**
{servicos}

Por favor efetue o pagamento até a data de vencimento.

Em caso de dúvidas, entre em contacto conosco.

Atenciosamente,
Departamento Financeiro
{sua_empresa}`,
    icon: '📄'
  },

  // CATEGORIA: Pessoal
  {
    id: 'out-of-office',
    name: 'Fora do Escritório',
    category: 'Pessoal',
    subject: 'Fora do escritório: {nome}',
    body: `Olá,

Estarei fora do escritório de {data_inicio} a {data_fim}.

Durante este período, terei acesso limitado ao email.

**Assuntos urgentes:**
Contato: {contato_urgente}
Telefone: {telefone_urgente}

Para assuntos não urgentes, responderei assim que possível.

Obrigado(a),
{seu_nome}`,
    icon: '🏖️'
  },
  {
    id: 'thank-you',
    name: 'Agradecimento',
    category: 'Pessoal',
    subject: 'Obrigado!',
    body: `Caro(a) {nome},

Gostaria de expressar o meu sincero agradecimento pelo {motivo}.

{mensagem_personalizada}

A sua colaboração foi fundamental e muito valorizada.

Fico à disposição para futuras oportunidades.

Com os melhores cumprimentos,
{seu_nome}`,
    icon: '🙏'
  },

  // CATEGORIA: Marketing
  {
    id: 'newsletter',
    name: 'Newsletter',
    category: 'Marketing',
    subject: '{titulo_newsletter}',
    body: `Olá {nome},

📰 **{titulo_newsletter}**

{conteudo_principal}

**Destaques da edição:**
{destaques}

**Artigo em destaque:**
{artigo_destaque}

**Próximos eventos:**
{eventos}

Não quer receber mais emails? Clique aqui para cancelar a inscrição.

Atenciosamente,
{sua_empresa}`,
    icon: '📰'
  },
  {
    id: 'promotion',
    name: 'Promoção',
    category: 'Marketing',
    subject: '🎉 Oferta Especial: {produto}',
    body: `Caro(a) {nome},

Temos uma oferta especial para você!

**{produto}**
- De: {preco_antigo} MT
- Por: {preco_novo} MT
- Economia: {economia} MT

**Benefícios:**
{beneficios}

Esta oferta é válida até {data_validade}.

Aproveite agora! Clique aqui para acessar.

Atenciosamente,
{sua_empresa}`,
    icon: '🎁'
  }
];

export const templateCategories = [
  'Boas-vindas',
  'Vendas',
  'Suporte',
  'Reuniões',
  'Notificações',
  'Pessoal',
  'Marketing'
];

export const getTemplateById = (id: string): EmailTemplate | undefined => {
  return emailTemplates.find(t => t.id === id);
};

export const getTemplatesByCategory = (category: string): EmailTemplate[] => {
  return emailTemplates.filter(t => t.category === category);
};
