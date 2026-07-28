# Guia do Painel Administrativo - WEHOSTHERE

## Acesso ao Painel Administrativo

O painel administrativo está disponível em: `http://localhost:3000/admin`

⚠️ **Nota de Segurança:** Este é um MVP e o painel administrativo não possui autenticação separada. Em produção, implemente:
- Autenticação administrativa separada
- Verificação de permissões
- Proteção de rotas admin
- Logs de auditoria

## Funcionalidades do Painel Admin

### 1. Dashboard com Estatísticas

O painel administrativo mostra métricas importantes do sistema:

- **Total de Usuários:** Número de usuários cadastrados
- **Sites Ativos:** Quantidade de sites configurados
- **Contas de Email:** Total de contas de email criadas
- **Receita Mensal (MRR):** Soma de todos os planos ativos

### 2. Gestão de Usuários

Tabela com todos os usuários cadastrados mostrando:

- **Nome:** Nome completo do usuário
- **Email:** Endereço de email
- **Plano:** Plano atual (Básico, Profissional, Empresarial)
- **Status:** Status da conta (Ativo, Pendente, Suspenso)
- **Data de Cadastro:** Quando o usuário se registrou
- **Ações:** Botões para gerenciar ou suspender usuários

### 3. Distribuição de Planos

Visualização gráfica da distribuição de planos:
- **Básico** (Cinza)
- **Profissional** (Azul)
- **Empresarial** (Roxo)

### 4. Atividade Recente

Feed das atividades mais recentes:
- Novos usuários cadastrados
- Sites adicionados
- Contas de email criadas

### 5. Ações Rápidas

Botões para acessar rapidamente:
- Gerenciar Usuários
- Gerenciar Sites
- Gerenciar Emails
- Configurações do Sistema

## Gerenciamento de Usuários

### Visualizar Usuários

Todos os usuários são listados na tabela principal com suas informações.

### Status de Usuários

Os usuários podem ter os seguintes status:
- **Ativo (✓):** Usuário pode acessar o sistema normalmente
- **Pendente (⏰):** Aguardando confirmação ou pagamento
- **Suspenso (✗):** Acesso temporariamente bloqueado

### Ações Disponíveis

Para cada usuário, você pode:
- **⚙️ Configurações:** Acessar configurações do usuário
- **✗ Suspender:** Suspender a conta do usuário

## Cálculo de MRR (Monthly Recurring Revenue)

O MRR é calculado automaticamente somando:
- Plano Básico: R$ 19
- Plano Profissional: R$ 49
- Plano Empresarial: R$ 99

## Melhorias Futuras para Produção

### Autenticação Administrativa

```typescript
// Exemplo de middleware para proteção admin
export async function middleware(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.isAdmin) {
    return NextResponse.redirect('/login');
  }
  
  return NextResponse.next();
}
```

### Funcionalidades Adicionais

1. **Gestão Avançada de Usuários**
   - Editar informações do usuário
   - Alterar plano manualmente
   - Histórico de atividades
   - Logs de login

2. **Sistema de Suporte**
   - Visualizar tickets de suporte
   - Responder a usuários
   - Categorizar problemas

3. **Relatórios e Analytics**
   - Gráficos de crescimento
   - Taxa de churn
   - Receita por período
   - Análise de uso de recursos

4. **Gestão de Servidores**
   - Status dos servidores
   - Monitoramento de recursos
   - Alertas de uso
   - Gestão de backups

5. **Configurações do Sistema**
   - Configurar planos e preços
   - Definir limites de recursos
   - Configurar integrações
   - Gerenciar API keys

6. **Ferramentas de Manutenção**
   - Limpar cache
   - Otimizar banco de dados
   - Reiniciar serviços
   - Verificar integridade

## Segurança

### Recomendações de Segurança

1. **Autenticação de Dois Fatores (2FA)**
   - Implementar 2FA para acesso admin
   - Usar TOTP ou SMS

2. **IP Whitelist**
   - Restringir acesso admin por IP
   - VPN obrigatória para acessos remotos

3. **Logs de Auditoria**
   - Registrar todas as ações admin
   - Armazenar logs de forma segura
   - Alertas para atividades suspeitas

4. **Rate Limiting**
   - Limitar tentativas de login
   - Proteger contra força bruta
   - CAPTCHA para formulários públicos

5. **Separação de Ambientes**
   - Ambiente de desenvolvimento separado
   - Testes de segurança regulares
   - Penetration testing

## Monitoramento

### Métricas Importantes

Monitore regularmente:
- Número de usuários ativos
- Taxa de conversão
- Receita recorrente
- Uso de recursos (CPU, memória, armazenamento)
- Tempo de resposta do sistema
- Taxa de erros

### Alertas

Configure alertas para:
- Alta utilização de recursos
- Falhas no sistema
- Atividades suspeitas
- Queda de receita
- Aumento de tickets de suporte

## Suporte

Para dúvidas sobre o painel administrativo:
- Consulte a documentação do Next.js
- Verifique os logs do sistema
- Entre em contato com a equipe de desenvolvimento

---

**Nota:** Este painel administrativo é um MVP demonstrativo. Para uso em produção, implemente as medidas de segurança e funcionalidades adicionais mencionadas acima.
