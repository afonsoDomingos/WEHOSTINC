# Guia do Usuário - WEHOSTHERE

## Bem-vindo à WEHOSTHERE!

Este guia vai ajudá-lo a começar a usar sua plataforma de hospedagem de sites e email.

## Primeiros Passos

### 1. Criar sua Conta

1. Acesse `http://localhost:3000`
2. Clique em "Criar Conta"
3. Preencha seus dados:
   - Nome completo
   - Email
   - Senha (mínimo 6 caracteres)
   - Confirme a senha
4. Aceite os termos de serviço
5. Clique em "Criar Conta"

### 2. Fazer Login

1. Acesse `http://localhost:3000/login`
2. Digite seu email e senha
3. Clique em "Entrar"

## Dashboard Principal

Após fazer login, você verá o dashboard com:

- **Plano Atual:** Seu plano de hospedagem
- **Estatísticas:** Número de sites, emails e armazenamento
- **Ações Rápidas:** Links para adicionar sites, configurar email, etc.
- **Atividade Recente:** Últimas atividades na sua conta

## Gerenciar Sites

### Adicionar um Novo Site

1. No menu lateral, clique em "Meus Sites"
2. Clique em "Adicionar Site"
3. Preencha as informações:
   - Nome do site (ex: "Meu Blog Pessoal")
   - Domínio (ex: "meusite.com")
4. Clique em "Adicionar"

### Gerenciar Sites Existentes

Na lista de sites, você pode:
- Ver o status (Ativo, Pendente, Suspenso)
- Ver armazenamento e tráfego utilizados
- Acessar configurações (ícone de engrenagem)
- Excluir o site (ícone de lixeira)

## Gerenciar Email

### Criar uma Conta de Email

1. No menu lateral, clique em "Email"
2. Clique em "Nova Conta"
3. Preencha:
   - Endereço de email (ex: contato@seusite.com)
   - Senha
4. Clique em "Criar Conta"

### Configurar seu Cliente de Email

Use estas configurações no seu cliente de email (Outlook, Thunderbird, etc.):

- **Servidor POP3:** mail.wehosthere.com
- **Servidor IMAP:** mail.wehosthere.com
- **Servidor SMTP:** smtp.wehosthere.com
- **Porta:** 587 (TLS)

### Gerenciar Contas de Email

Na lista de emails, você pode:
- Ver o status da conta
- Ver armazenamento utilizado
- Ver data de criação
- Acessar configurações
- Excluir a conta

## Planos de Hospedagem

### Planos Disponíveis

- **Básico (R$ 19/mês)**
  - 1 Site
  - 5 Contas de Email
  - 10 GB Armazenamento
  - Tráfego Ilimitado

- **Profissional (R$ 49/mês)**
  - 5 Sites
  - 20 Contas de Email
  - 50 GB Armazenamento
  - Tráfego Ilimitado
  - SSL Grátis

- **Empresarial (R$ 99/mês)**
  - Sites Ilimitados
  - Email Ilimitado
  - 200 GB Armazenamento
  - Tráfego Ilimitado
  - SSL + CDN Grátis

### Fazer Upgrade de Plano

1. No menu lateral, clique em "Faturamento"
2. Na seção "Fazer Upgrade", escolha o plano desejado
3. Clique em "Fazer Upgrade"
4. Seu plano será atualizado imediatamente

## Faturamento

### Visualizar Plano Atual

Na página de faturamento, você pode ver:
- Seu plano atual
- Preço mensal
- Recursos incluídos
- Sites e emails disponíveis

### Histórico de Pagamentos

Todos os pagamentos são listados com:
- Data do pagamento
- Valor pago
- Plano correspondente

### Método de Pagamento

Você pode configurar seu método de pagamento na seção "Método de Pagamento".

## Configurações da Conta

### Atualizar Perfil

1. No menu lateral, clique em "Configurações"
2. Na seção "Perfil", atualize:
   - Nome completo
   - Email
3. Clique em "Salvar Alterações"

### Alterar Senha

1. Na seção "Senha", digite:
   - Senha atual
   - Nova senha
   - Confirme a nova senha
2. Clique em "Atualizar Senha"

### Informações da Conta

Você pode ver:
- ID da sua conta
- Plano atual
- Data de cadastro
- Status da conta

### Excluir Conta

⚠️ **Cuidado:** Esta ação é irreversível!

1. Na seção "Zona de Perigo"
2. Clique em "Excluir Conta"
3. Confirme a exclusão

## Dicas de Uso

### Organização

- Use nomes descritivos para seus sites
- Mantenha seus emails organizados por projeto
- Monitore seu uso de armazenamento regularmente

### Segurança

- Use senhas fortes
- Não compartilhe suas credenciais
- Altere sua senha regularmente
- Mantenha seu email atualizado

### Recursos

- Aproveite o SSL grátis nos planos superiores
- Use o CDN para melhorar performance
- Monitore seu tráfego para evitar surpresas

## Suporte

### Precisa de Ajuda?

- Consulte nossa documentação
- Entre em contato pelo suporte
- Verifique nossos tutoriais

### Status do Sistema

Verifique o status dos nossos serviços em tempo real.

## Acesso Rápido

- **Landing Page:** `http://localhost:3000`
- **Login:** `http://localhost:3000/login`
- **Dashboard:** `http://localhost:3000/dashboard`
- **Meus Sites:** `http://localhost:3000/dashboard/sites`
- **Email:** `http://localhost:3000/dashboard/email`
- **Faturamento:** `http://localhost:3000/dashboard/billing`
- **Configurações:** `http://localhost:3000/dashboard/settings`

## FAQ

### Quantos sites posso hospedar?

Depende do seu plano:
- Básico: 1 site
- Profissional: 5 sites
- Empresarial: Ilimitados

### Como faço upload dos meus arquivos?

Esta funcionalidade estará disponível em breve. Atualmente, o sistema está em modo demonstração.

### Posso mudar de plano a qualquer momento?

Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento na seção de faturamento.

### Meus dados estão seguros?

Sim! Implementamos várias medidas de segurança para proteger seus dados. Em produção, teremos criptografia SSL, backups diários e monitoramento 24/7.

### Como configuro meu domínio?

Após adicionar um site, você receberá instruções para configurar os DNS do seu domínio. Esta funcionalidade estará disponível em breve.

---

**Nota:** Esta é uma versão MVP (Minimum Viable Product) para demonstração. Algumas funcionalidades podem estar simuladas ou em desenvolvimento.

Para dúvidas ou sugestões, entre em contato com nosso suporte.
