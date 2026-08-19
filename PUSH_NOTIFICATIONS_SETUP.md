# Configuração de Notificações Push - Render e Vercel

## Variáveis de Ambiente Necessárias

Para que as notificações push funcionem em produção, você precisa adicionar estas variáveis de ambiente:

### Render
1. Acesse seu projeto no Render
2. Vá em Settings → Environment
3. Adicione as seguintes variáveis:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua_chave_publica_aqui
VAPID_PRIVATE_KEY=sua_chave_privada_aqui
```

### Vercel
1. Acesse seu projeto no Vercel
2. Vá em Settings → Environment Variables
3. Adicione as seguintes variáveis:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua_chave_publica_aqui
VAPID_PRIVATE_KEY=sua_chave_privada_aqui
```

## Como Gerar Chaves VAPID

### Opção 1: Usar o sistema automático (Desenvolvimento)
Quando você acessar o dashboard pela primeira vez e clicar em "Ativar Push", o sistema gerará automaticamente as chaves e mostrará no console:

```
[VAPID] Chaves geradas (salvar em .env.local):
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BCpK8T8ZBF...
VAPID_PRIVATE_KEY=YOUR_PRIVATE_KEY...
```

### Opção 2: Gerar manualmente (Recomendado para Produção)
Execute este comando no terminal:

```bash
npx web-push generate-vapid-keys
```

Ou crie um script temporário:

```javascript
// generate-vapid.js
const webpush = require('web-push');
const vapidKeys = webpush.generateVAPIDKeys();
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
```

Execute:
```bash
node generate-vapid.js
```

## Importante

- **NEXT_PUBLIC_VAPID_PUBLIC_KEY**: Chave pública (pode ser exposta no frontend)
- **VAPID_PRIVATE_KEY**: Chave privada (NUNCA exposta no frontend, apenas backend)
- Use as mesmas chaves em todas as plataformas (Render, Vercel, local)
- As chaves são específicas para cada domínio/email

## Requisitos para Funcionamento

1. **HTTPS obrigatório**: Notificações push só funcionam em HTTPS (ou localhost)
2. **Service Worker registrado**: Já implementado automaticamente
3. **Permissão do usuário**: Usuário precisa permitir notificações
4. **Chaves VAPID válidas**: Configuradas nas variáveis de ambiente

## Teste em Produção

Após configurar as variáveis:

1. Acesse `/dashboard/notifications`
2. Clique em "Ativar Push"
3. Permita as notificações
4. Clique em "Testar Push"
5. Verifique se recebe a notificação no dispositivo

## Troubleshooting

### Notificações não aparecem
- Verifique se está usando HTTPS
- Confirme que as variáveis de ambiente estão configuradas
- Verifique o console do navegador por erros
- Confirme que o usuário permitiu notificações

### Erro "Subscription expired"
- O usuário precisa reativar as notificações push
- Isso acontece quando as chaves mudam ou subscription expira

### Erro 410/404 ao enviar
- A subscription expirou ou é inválida
- O sistema remove automaticamente subscriptions inválidas
- Usuário precisa reativar notificações
