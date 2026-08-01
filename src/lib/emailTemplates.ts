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
  },

  // CATEGORIA: Tabelas
  {
    id: 'invoice-table',
    name: 'Fatura com Tabela',
    nameEN: 'Invoice with Table',
    category: 'Tabelas',
    categoryEN: 'Tables',
    subject: 'Fatura #{numero} - {cliente}',
    subjectEN: 'Invoice #{number} - {client}',
    body: `Caro(a) {nome},

Segue abaixo a fatura detalhada dos serviços prestados.

**Fatura #{numero}**
- Cliente: {cliente}
- Data de emissão: {data_emissao}
- Data de vencimento: {data_vencimento}

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background-color: #f3f4f6;">
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Descrição</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">Quantidade</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">Preço Unit.</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">Total</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{item1_descricao}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{item1_qtd}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">{item1_preco} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">{item1_total} MT</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{item2_descricao}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{item2_qtd}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">{item2_preco} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">{item2_total} MT</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{item3_descricao}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{item3_qtd}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">{item3_preco} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">{item3_total} MT</td>
    </tr>
  </tbody>
  <tfoot>
    <tr style="background-color: #f9fafb; font-weight: bold;">
      <td colspan="3" style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">Total:</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">{valor_total} MT</td>
    </tr>
  </tfoot>
</table>

**Informações de Pagamento:**
- Referência: {referencia}
- Banco: {banco}
- IBAN: {iban}

Por favor efetue o pagamento até a data de vencimento.

Atenciosamente,
{seu_nome}
{sua_empresa}`,
    bodyEN: `Dear {name},

Below is the detailed invoice for services rendered.

**Invoice #{number}**
- Client: {client}
- Issue date: {issue_date}
- Due date: {due_date}

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background-color: #f3f4f6;">
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Description</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">Quantity</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">Unit Price</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">Total</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{item1_description}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{item1_qty}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">{item1_price} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">{item1_total} MT</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{item2_description}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{item2_qty}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">{item2_price} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">{item2_total} MT</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{item3_description}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{item3_qty}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">{item3_price} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">{item3_total} MT</td>
    </tr>
  </tbody>
  <tfoot>
    <tr style="background-color: #f9fafb; font-weight: bold;">
      <td colspan="3" style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">Total:</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: right;">{total_value} MT</td>
    </tr>
  </tfoot>
</table>

**Payment Information:**
- Reference: {reference}
- Bank: {bank}
- IBAN: {iban}

Please make the payment by the due date.

Sincerely,
{your_name}
{your_company}`,
    icon: '📊'
  },
  {
    id: 'price-list',
    name: 'Lista de Preços',
    nameEN: 'Price List',
    category: 'Tabelas',
    categoryEN: 'Tables',
    subject: 'Lista de Preços - {categoria}',
    subjectEN: 'Price List - {category}',
    body: `Olá {nome},

Segue a nossa lista de preços atualizada para {categoria}.

**Tabela de Preços**

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background-color: #f3f4f6;">
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Serviço</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">Plano Básico</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">Plano Pro</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">Plano Enterprise</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{servico1}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{servico1_basico} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{servico1_pro} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{servico1_enterprise} MT</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{servico2}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{servico2_basico} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{servico2_pro} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{servico2_enterprise} MT</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{servico3}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{servico3_basico} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{servico3_pro} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{servico3_enterprise} MT</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{servico4}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{servico4_basico} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{servico4_pro} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{servico4_enterprise} MT</td>
    </tr>
  </tbody>
</table>

**Observações:**
{observacoes}

Para mais informações, entre em contacto.

Atenciosamente,
{seu_nome}
{sua_empresa}`,
    bodyEN: `Hello {name},

Below is our updated price list for {category}.

**Price Table**

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background-color: #f3f4f6;">
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Service</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">Basic Plan</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">Pro Plan</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">Enterprise Plan</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{service1}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{service1_basic} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{service1_pro} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{service1_enterprise} MT</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{service2}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{service2_basic} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{service2_pro} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{service2_enterprise} MT</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{service3}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{service3_basic} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{service3_pro} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{service3_enterprise} MT</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{service4}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{service4_basic} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{service4_pro} MT</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{service4_enterprise} MT</td>
    </tr>
  </tbody>
</table>

**Notes:**
{notes}

For more information, please contact us.

Sincerely,
{your_name}
{your_company}`,
    icon: '💲'
  },
  {
    id: 'schedule-table',
    name: 'Tabela de Horários',
    nameEN: 'Schedule Table',
    category: 'Tabelas',
    categoryEN: 'Tables',
    subject: 'Horário de {evento}',
    subjectEN: 'Schedule for {event}',
    body: `Olá {nome},

Segue a tabela de horários para {evento}.

**Programação**

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background-color: #f3f4f6;">
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Horário</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Atividade</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Local</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Responsável</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{horario1}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{atividade1}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{local1}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{responsavel1}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{horario2}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{atividade2}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{local2}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{responsavel2}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{horario3}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{atividade3}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{local3}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{responsavel3}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{horario4}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{atividade4}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{local4}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{responsavel4}</td>
    </tr>
  </tbody>
</table>

**Informações Adicionais:**
{informacoes_adicionais}

Qualquer dúvida, entre em contacto.

Atenciosamente,
{seu_nome}`,
    bodyEN: `Hello {name},

Below is the schedule for {event}.

**Schedule**

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background-color: #f3f4f6;">
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Time</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Activity</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Location</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Responsible</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{time1}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{activity1}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{location1}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{responsible1}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{time2}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{activity2}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{location2}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{responsible2}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{time3}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{activity3}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{location3}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{responsible3}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{time4}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{activity4}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{location4}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{responsible4}</td>
    </tr>
  </tbody>
</table>

**Additional Information:**
{additional_information}

For any questions, please contact us.

Sincerely,
{your_name}`,
    icon: '📅'
  },
  {
    id: 'comparison-table',
    name: 'Tabela de Comparação',
    nameEN: 'Comparison Table',
    category: 'Tabelas',
    categoryEN: 'Tables',
    subject: 'Comparação: {assunto}',
    subjectEN: 'Comparison: {subject}',
    body: `Olá {nome},

Segue uma tabela comparativa para {assunto}.

**Comparação**

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background-color: #f3f4f6;">
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Característica</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">Opção A</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">Opção B</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">Opção C</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{caracteristica1}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{opcao1_a}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{opcao1_b}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{opcao1_c}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{caracteristica2}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{opcao2_a}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{opcao2_b}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{opcao2_c}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{caracteristica3}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{opcao3_a}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{opcao3_b}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{opcao3_c}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{caracteristica4}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{opcao4_a}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{opcao4_b}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{opcao4_c}</td>
    </tr>
  </tbody>
</table>

**Recomendação:**
{recomendacao}

Para mais detalhes, entre em contacto.

Atenciosamente,
{seu_nome}`,
    bodyEN: `Hello {name},

Below is a comparison table for {subject}.

**Comparison**

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <thead>
    <tr style="background-color: #f3f4f6;">
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: left;">Feature</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">Option A</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">Option B</th>
      <th style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">Option C</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{feature1}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{option1_a}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{option1_b}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{option1_c}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{feature2}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{option2_a}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{option2_b}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{option2_c}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{feature3}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{option3_a}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{option3_b}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{option3_c}</td>
    </tr>
    <tr>
      <td style="border: 1px solid #e5e7eb; padding: 12px;">{feature4}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{option4_a}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{option4_b}</td>
      <td style="border: 1px solid #e5e7eb; padding: 12px; text-align: center;">{option4_c}</td>
    </tr>
  </tbody>
</table>

**Recommendation:**
{recommendation}

For more details, please contact us.

Sincerely,
{your_name}`,
    icon: '📊'
  }
];

export const templateCategories = [
  'Boas-vindas',
  'Vendas',
  'Suporte',
  'Reuniões',
  'Notificações',
  'Pessoal',
  'Marketing',
  'Tabelas'
];

export const templateCategoriesEN = [
  'Welcome',
  'Sales',
  'Support',
  'Meetings',
  'Notifications',
  'Personal',
  'Marketing',
  'Tables'
];

export const getTemplateById = (id: string): EmailTemplate | undefined => {
  return emailTemplates.find(t => t.id === id);
};

export const getTemplatesByCategory = (category: string): EmailTemplate[] => {
  return emailTemplates.filter(t => t.category === category);
};
