# WEHOSTHERE - Plataforma de Hospedagem de Sites e Email

Plataforma MVP de hospedagem de sites e email profissional, desenvolvida com Next.js e TypeScript.

## 🚀 Funcionalidades

### Landing Page
- Design moderno e responsivo
- Apresentação de planos de hospedagem
- Informações sobre recursos e benefícios
- Call-to-action para cadastro

### Sistema de Autenticação
- Cadastro de novos usuários
- Login com email e senha
- Gerenciamento de sessão (simulado com localStorage)
- Proteção de rotas privadas

### Painel do Cliente (Dashboard)
- Visão geral da conta
- Estatísticas de uso
- Ações rápidas
- Atividade recente

### Gestão de Sites
- Adicionar novos sites
- Listar sites configurados
- Status dos sites (ativo, pendente, suspenso)
- Informações de armazenamento e tráfego
- Excluir sites

### Gestão de Email
- Criar contas de email profissionais
- Listar contas configuradas
- Status das contas
- Informações de configuração (POP3, IMAP, SMTP)
- Excluir contas

### Sistema de Planos
- 3 planos: Básico, Profissional, Empresarial
- Upgrade de plano
- Recursos por plano (sites, emails, armazenamento)
- Histórico de pagamentos

### Configurações da Conta
- Atualizar perfil (nome, email)
- Alterar senha
- Informações da conta
- Zona de perigo (excluir conta)

### Painel Administrativo
- Dashboard administrativo com estatísticas
- Gestão de usuários cadastrados
- Visualização de sites e emails
- Distribuição de planos
- Atividade recente do sistema
- Ações rápidas de gestão

## 🛠️ Tecnologias

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **localStorage** - Simulação de banco de dados

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Passos

1. **Navegue até o diretório do projeto:**
   ```bash
   cd wehosthere
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Execute o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador:**
   ```
   http://localhost:3000
   ```

## 📁 Estrutura do Projeto

```
wehosthere/
├── src/
│   ├── app/
│   │   ├── admin/             # Painel administrativo
│   │   │   └── page.tsx       # Dashboard admin
│   │   ├── dashboard/
│   │   │   ├── billing/       # Sistema de pagamentos
│   │   │   ├── email/         # Gestão de email
│   │   │   ├── settings/      # Configurações da conta
│   │   │   ├── sites/         # Gestão de sites
│   │   │   └── page.tsx       # Dashboard principal
│   │   ├── login/             # Página de login
│   │   ├── register/          # Página de cadastro
│   │   ├── layout.tsx         # Layout principal
│   │   ├── page.tsx           # Landing page
│   │   └── globals.css        # Estilos globais
│   ├── components/            # Componentes reutilizáveis
│   └── lib/
│       ├── auth.ts            # Sistema de autenticação
│       └── data.ts            # Gestão de dados
├── public/                    # Arquivos estáticos
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🎨 Design

- **Cores:** Paleta azul profissional
- **Responsivo:** Funciona em desktop, tablet e mobile
- **Ícones:** Lucide React para consistência visual
- **Framework:** Tailwind CSS para estilização rápida

## 🔐 Segurança

⚠️ **AVISO IMPORTANTE:** Este é um MVP com fins de demonstração. O sistema de autenticação usa localStorage e as senhas são armazenadas em texto simples. Em produção, você deve:

- Usar NextAuth.js ou similar para autenticação
- Implementar bcrypt ou similar para hash de senhas
- Usar banco de dados real (PostgreSQL, MySQL, etc.)
- Implementar HTTPS
- Adicionar validação de email
- Implementar recuperação de senha
- Adicionar proteção contra CSRF

## 🚀 Próximos Passos (Para Produção)

1. **Backend Real:**
   - Implementar API com Node.js/Express
   - Conectar banco de dados real
   - Implementar autenticação JWT

2. **Integração de Pagamento:**
   - Integrar Stripe ou PayPal
   - Implementar webhooks
   - Gestão de assinaturas

3. **Integração de Hospedagem:**
   - Conectar com APIs de provedores (DigitalOcean, AWS)
   - Implementar gestão de servidores
   - Configurar DNS automático

4. **Sistema de Email Real:**
   - Integrar com serviços de email (Mailgun, SendGrid)
   - Configurar servidores de email (Postfix, Dovecot)
   - Implementar webmail

5. **Painel Administrativo:**
   - Gestão de usuários
   - Relatórios e analytics
   - Suporte ao cliente

6. **Recursos Adicionais:**
   - Sistema de tickets de suporte
   - Certificado SSL automático
   - CDN integrado
   - Backup automático

## 📝 Licença

Este projeto é um MVP demonstrativo. Sinta-se livre para usar como base para seu projeto comercial.

## 👨‍💻 Desenvolvimento

Desenvolvido como MVP da plataforma WEHOSTHERE - Solução completa em hospedagem de sites e email.

---

**Nota:** Para executar este projeto, você precisa habilitar a execução de scripts no PowerShell se estiver usando Windows:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Depois, você pode executar os comandos npm normalmente.
