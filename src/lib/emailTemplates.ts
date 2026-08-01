export interface EmailTemplate {
  id: string;
  name: string;
  nameEN: string;
  category: string;
  categoryEN: string;
  subject: string;
  subjectEN: string;
  body: string;
  bodyEN: string;
  icon: string;
}

export const emailTemplates: EmailTemplate[] = [
  // CATEGORIA: Boas-vindas
  {
    id: 'welcome',
    name: 'Boas-vindas',
    nameEN: 'Welcome',
    category: 'Boas-vindas',
    categoryEN: 'Welcome',
    subject: 'Bem-vindo à nossa plataforma!',
    subjectEN: 'Welcome to our platform!',
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
    bodyEN: `Hello {name},

We are delighted to welcome you to our platform!

Your account has been successfully created and you can now start enjoying all our services.

Next steps:
- Complete your profile
- Explore available features
- Contact us if you need help

If you have any questions, please don't hesitate to contact our support team.

Best regards,
{your_name}
{your_company}`,
    icon: '🎉'
  },
  {
    id: 'welcome-client',
    name: 'Boas-vindas Cliente',
    nameEN: 'Client Welcome',
    category: 'Boas-vindas',
    categoryEN: 'Welcome',
    subject: 'Obrigado por se juntar a nós!',
    subjectEN: 'Thank you for joining us!',
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
    bodyEN: `Dear {name},

Thank you very much for choosing our services! It is a privilege to have you as a client.

Your account has been activated and you can now start enjoying all the benefits of your plan.

Important information:
- Plan: {plan}
- Start date: {start_date}
- Next invoice: {invoice_date}

We are at your disposal for any questions.

Sincerely,
{your_name}
{your_company}`,
    icon: '🤝'
  },

  // CATEGORIA: Vendas
  {
    id: 'quote-request',
    name: 'Solicitação de Orçamento',
    nameEN: 'Quote Request',
    category: 'Vendas',
    categoryEN: 'Sales',
    subject: 'Solicitação de Orçamento - {projeto}',
    subjectEN: 'Quote Request - {project}',
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
    bodyEN: `Dear Team,

I would like to request a quote for the following project:

**Project Details:**
- Type: {project_type}
- Description: {description}
- Desired deadline: {deadline}
- Estimated budget: {budget}

**Specific requirements:**
{requirements}

I look forward to receiving the detailed quote.

Sincerely,
{your_name}
{your_phone}`,
    icon: '💰'
  },
  {
    id: 'quote-response',
    name: 'Resposta de Orçamento',
    nameEN: 'Quote Response',
    category: 'Vendas',
    categoryEN: 'Sales',
    subject: 'Orçamento para {projeto}',
    subjectEN: 'Quote for {project}',
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
    bodyEN: `Dear {name},

Thank you for your interest in our services. Below is the requested quote:

**Quote #{quote_number}**
- Project: {project}
- Total value: {value} MT
- Delivery deadline: {deadline}
- Validity: {validity}

**Breakdown:**
{breakdown}

This quote is valid for {validity_days} days.

I am available for clarifications.

Best regards,
{your_name}
{your_company}`,
    icon: '📋'
  },
  {
    id: 'follow-up',
    name: 'Follow-up Vendas',
    nameEN: 'Sales Follow-up',
    category: 'Vendas',
    categoryEN: 'Sales',
    subject: 'Seguimento - {projeto}',
    subjectEN: 'Follow-up - {project}',
    body: `Olá {nome},

Espero que esteja bem!

Gostaria de fazer um seguimento sobre a nossa última conversa referente ao {projeto}.

Algum progresso desde então? Tem alguma dúvida ou precisa de informações adicionais?

Estou à disposição para ajudar no que for necessário.

Atenciosamente,
{seu_nome}`,
    bodyEN: `Hello {name},

I hope you are doing well!

I would like to follow up on our last conversation regarding {project}.

Any progress since then? Do you have any questions or need additional information?

I am available to help with whatever is needed.

Sincerely,
{your_name}`,
    icon: '📞'
  },

  // CATEGORIA: Suporte
  {
    id: 'support-ticket',
    name: 'Abertura de Ticket',
    nameEN: 'Support Ticket',
    category: 'Suporte',
    categoryEN: 'Support',
    subject: 'Ticket #{numero} - {assunto}',
    subjectEN: 'Ticket #{number} - {subject}',
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
    bodyEN: `Dear Support,

I would like to report the following issue:

**Problem Description:**
{description}

**Technical Information:**
- System: {system}
- Version: {version}
- Browser: {browser}
- Date/time: {datetime}

**Steps to reproduce:**
{steps}

I await a response as soon as possible.

Thank you,
{your_name}`,
    icon: '🎫'
  },
  {
    id: 'support-response',
    name: 'Resposta de Suporte',
    nameEN: 'Support Response',
    category: 'Suporte',
    categoryEN: 'Support',
    subject: 'Resolução do Ticket #{numero}',
    subjectEN: 'Ticket #{number} Resolution',
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
    bodyEN: `Dear {name},

Your ticket #{number} has been successfully resolved!

**Summary:**
{summary}

**Solution applied:**
{solution}

If you have any questions or the problem persists, please reply to this email.

We appreciate your patience and understanding.

Sincerely,
Support Team
{your_company}`,
    icon: '✅'
  },

  // CATEGORIA: Reuniões
  {
    id: 'meeting-invite',
    name: 'Convite de Reunião',
    nameEN: 'Meeting Invitation',
    category: 'Reuniões',
    categoryEN: 'Meetings',
    subject: 'Convite para Reunião: {assunto}',
    subjectEN: 'Meeting Invitation: {subject}',
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
    bodyEN: `Hello {name},

I would like to invite you to a meeting about {subject}.

**Meeting Details:**
- Date: {date}
- Time: {time}
- Duration: {duration}
- Location: {location}
- Link: {link}

**Agenda:**
{agenda}

Please confirm your attendance by {confirmation_date}.

Sincerely,
{your_name}`,
    icon: '📅'
  },
  {
    id: 'meeting-reminder',
    name: 'Lembrete de Reunião',
    nameEN: 'Meeting Reminder',
    category: 'Reuniões',
    categoryEN: 'Meetings',
    subject: 'Lembrete: Reunião às {horario}',
    subjectEN: 'Reminder: Meeting at {time}',
    body: `Olá {nome},

Este é um lembrete para a reunião agendada para hoje às {horario}.

**Detalhes:**
- Assunto: {assunto}
- Link: {link}
- Local: {local}

Por favor prepare-se com antecedência.

Atenciosamente,
{seu_nome}`,
    bodyEN: `Hello {name},

This is a reminder for the meeting scheduled for today at {time}.

**Details:**
- Subject: {subject}
- Link: {link}
- Location: {location}

Please prepare in advance.

Sincerely,
{your_name}`,
    icon: '⏰'
  },

  // CATEGORIA: Notificações
  {
    id: 'maintenance-notice',
    name: 'Aviso de Manutenção',
    nameEN: 'Maintenance Notice',
    category: 'Notificações',
    categoryEN: 'Notifications',
    subject: 'Aviso de Manutenção Programada',
    subjectEN: 'Scheduled Maintenance Notice',
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
    bodyEN: `Dear Client,

We inform you that we will perform scheduled maintenance on our systems.

**Maintenance Details:**
- Date: {date}
- Time: {start_time} to {end_time}
- Estimated duration: {duration}
- Affected services: {services}

During this period, the mentioned services may experience temporary interruptions.

We apologize for the inconvenience and appreciate your understanding.

Sincerely,
Technical Team
{your_company}`,
    icon: '🔧'
  },
  {
    id: 'invoice-sent',
    name: 'Envio de Fatura',
    nameEN: 'Invoice Sent',
    category: 'Notificações',
    categoryEN: 'Notifications',
    subject: 'Fatura #{numero} - {mes}',
    subjectEN: 'Invoice #{number} - {month}',
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
    bodyEN: `Dear {name},

We are sending the invoice for the month of {month} as an attachment.

**Invoice Details:**
- Number: {number}
- Value: {value} MT
- Due date: {due_date}
- Payment reference: {reference}

**Billed services:**
{services}

Please make the payment by the due date.

In case of doubts, please contact us.

Sincerely,
Finance Department
{your_company}`,
    icon: '📄'
  },

  // CATEGORIA: Pessoal
  {
    id: 'out-of-office',
    name: 'Fora do Escritório',
    nameEN: 'Out of Office',
    category: 'Pessoal',
    categoryEN: 'Personal',
    subject: 'Fora do escritório: {nome}',
    subjectEN: 'Out of office: {name}',
    body: `Olá,

Estarei fora do escritório de {data_inicio} a {data_fim}.

Durante este período, terei acesso limitado ao email.

**Assuntos urgentes:**
Contato: {contato_urgente}
Telefone: {telefone_urgente}

Para assuntos não urgentes, responderei assim que possível.

Obrigado(a),
{seu_nome}`,
    bodyEN: `Hello,

I will be out of the office from {start_date} to {end_date}.

During this period, I will have limited access to email.

**Urgent matters:**
Contact: {urgent_contact}
Phone: {urgent_phone}

For non-urgent matters, I will respond as soon as possible.

Thank you,
{your_name}`,
    icon: '🏖️'
  },
  {
    id: 'thank-you',
    name: 'Agradecimento',
    nameEN: 'Thank You',
    category: 'Pessoal',
    categoryEN: 'Personal',
    subject: 'Obrigado!',
    subjectEN: 'Thank you!',
    body: `Caro(a) {nome},

Gostaria de expressar o meu sincero agradecimento pelo {motivo}.

{mensagem_personalizada}

A sua colaboração foi fundamental e muito valorizada.

Fico à disposição para futuras oportunidades.

Com os melhores cumprimentos,
{seu_nome}`,
    bodyEN: `Dear {name},

I would like to express my sincere gratitude for {reason}.

{personal_message}

Your collaboration was fundamental and highly valued.

I am available for future opportunities.

Best regards,
{your_name}`,
    icon: '🙏'
  },

  // CATEGORIA: Marketing
  {
    id: 'newsletter',
    name: 'Newsletter',
    nameEN: 'Newsletter',
    category: 'Marketing',
    categoryEN: 'Marketing',
    subject: '{titulo_newsletter}',
    subjectEN: '{newsletter_title}',
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
    bodyEN: `Hello {name},

📰 **{newsletter_title}**

{main_content}

**Highlights of this edition:**
{highlights}

**Featured article:**
{featured_article}

**Upcoming events:**
{events}

Don't want to receive more emails? Click here to unsubscribe.

Sincerely,
{your_company}`,
    icon: '📰'
  },
  {
    id: 'promotion',
    name: 'Promoção',
    nameEN: 'Promotion',
    category: 'Marketing',
    categoryEN: 'Marketing',
    subject: '🎉 Oferta Especial: {produto}',
    subjectEN: '🎉 Special Offer: {product}',
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
    bodyEN: `Dear {name},

We have a special offer for you!

**{product}**
- From: {old_price} MT
- For: {new_price} MT
- Savings: {savings} MT

**Benefits:**
{benefits}

This offer is valid until {validity_date}.

Take advantage now! Click here to access.

Sincerely,
{your_company}`,
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

export const templateCategoriesEN = [
  'Welcome',
  'Sales',
  'Support',
  'Meetings',
  'Notifications',
  'Personal',
  'Marketing'
];

export const getTemplateById = (id: string): EmailTemplate | undefined => {
  return emailTemplates.find(t => t.id === id);
};

export const getTemplatesByCategory = (category: string): EmailTemplate[] => {
  return emailTemplates.filter(t => t.category === category);
};
