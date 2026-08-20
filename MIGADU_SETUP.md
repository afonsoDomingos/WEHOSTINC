# Configuração Migadu - Webmail

## Credenciais Fornecidas
- **API Key:** uTp8eVp2W57IecjduBQzYM0lpPC2gYVqHbvFsyhJwZO2U3Te5bbMt7jLs1frFjpzshXT0DwSVcucatIiCnszAg
- **Username:** wehosthereinc@gmail.com
- **Email de Teste:** info@wehosthere.com
- **Domínio:** wehosthere.com

## Passo 1: Configurar .env.local

Adicione estas linhas ao seu arquivo `.env.local`:

```bash
# Configurações de Migadu
EMAIL_PROVIDER=migadu
MIGADU_API_URL=https://api.migadu.com/v1
MIGADU_USERNAME=wehosthereinc@gmail.com
MIGADU_API_KEY=uTp8eVp2W57IecjduBQzYM0lpPC2gYVqHbvFsyhJwZO2U3Te5bbMt7jLs1frFjpzshXT0DwSVcucatIiCnszAg
MIGADU_IMAP_HOST=imap.migadu.com
MIGADU_IMAP_PORT=993
MIGADU_SMTP_HOST=smtp.migadu.com
MIGADU_SMTP_PORT=465

# Ambiente (mudar para production quando for para produção)
NODE_ENV=development
```

## Passo 2: Reiniciar o Servidor

```bash
npm run dev
```

## Passo 3: Acessar Webmail

1. Acesse o painel admin: `http://localhost:3000/admin`
2. Faça login como admin
3. Clique na nova aba "Webmail" no menu superior
4. Insira as credenciais:
   - **Email:** info@wehosthere.com
   - **Password:** [a password da mailbox info@wehosthere.com no Migadu]

## Passo 4: Testar

### Teste 1: Receber Email
1. Envie um email de Gmail para info@wehosthere.com
2. Clique em refresh no webmail
3. Verifique se o email aparece

### Teste 2: Enviar Email
1. Clique em "Compor"
2. Envie um email para o seu Gmail pessoal
3. Verifique se recebeu

### Teste 3: Anexos
1. Clique em "Compor"
2. Anexe um PDF ou imagem
3. Envie o email
4. Verifique se o anexo chegou

## Notas Importantes

- A aba "Webmail" foi adicionada ao painel admin para facilitar testes
- Em desenvolvimento, ainda há fallback para localStorage se IMAP falhar
- Em produção, não há fallback - erros são mostrados claramente
- A password da mailbox info@wehosthere.com deve ser obtida do painel Migadu
- Se não souber a password, pode resetar via API ou painel Migadu

## Troubleshooting

### Erro: "Mailbox não encontrada"
- Verifique se a mailbox info@wehosthere.com existe no Migadu
- Verifique se o domínio wehosthere.com está configurado no Migadu

### Erro: "Credenciais inválidas"
- Verifique se a password da mailbox está correta
- Verifique se a mailbox está ativa no Migadu

### Erro: "Não foi possível conectar ao servidor de email"
- Verifique as credenciais da API Migadu
- Verifique se o servidor IMAP/SMTP está acessível
- Verifique se NODE_ENV está configurado corretamente

## Próximos Passos

Após testar com sucesso:
1. Mudar NODE_ENV para production
2. Testar novamente para garantir que não há fallback
3. Monitorar logs para garantir que não há credenciais expostas
