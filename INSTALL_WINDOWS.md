# Instruções de Instalação - Windows

## Problema: Execução de Scripts no PowerShell

Se você está encontrando o erro:
```
npm : File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled on this system.
```

Isso acontece porque a política de execução do PowerShell está configurada para não permitir scripts.

## Solução

### Opção 1: Habilitar Scripts (Recomendado)

1. Abra o PowerShell como **Administrador**
2. Execute o seguinte comando:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. Pressione `Y` para confirmar
4. Feche o PowerShell e abra novamente (sem precisar ser administrador)
5. Agora você pode executar comandos npm normalmente

### Opção 2: Usar Command Prompt (cmd) em vez do PowerShell

1. Pressione `Win + R`
2. Digite `cmd` e pressione Enter
3. Navegue até o diretório do projeto:
   ```cmd
   cd C:\Users\Dell\Documents\DEVPROJECTS\WEHOSTINC\wehosthere
   ```
4. Execute os comandos npm:
   ```cmd
   npm install
   npm run dev
   ```

### Opção 3: Usar Git Bash

Se você tem Git instalado, você pode usar o Git Bash que não tem essa restrição:

1. Abra o Git Bash
2. Navegue até o diretório do projeto:
   ```bash
   cd /c/Users/Dell/Documents/DEVPROJECTS/WEHOSTINC/wehosthere
   ```
3. Execute os comandos npm:
   ```bash
   npm install
   npm run dev
   ```

## Instalação Completa (Após resolver o problema)

### 1. Instalar Dependências
```bash
npm install
```

### 2. Executar em Modo de Desenvolvimento
```bash
npm run dev
```

### 3. Acessar a Aplicação
Abra seu navegador e acesse: `http://localhost:3000`

## Comandos Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria uma build de produção
- `npm start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter para verificar código

## Estrutura de URLs

- `http://localhost:3000` - Landing Page
- `http://localhost:3000/login` - Página de Login
- `http://localhost:3000/register` - Página de Cadastro
- `http://localhost:3000/dashboard` - Dashboard do Cliente
- `http://localhost:3000/dashboard/sites` - Gestão de Sites
- `http://localhost:3000/dashboard/email` - Gestão de Email
- `http://localhost:3000/dashboard/billing` - Faturamento
- `http://localhost:3000/dashboard/settings` - Configurações
- `http://localhost:3000/admin` - Painel Administrativo

## Teste da Aplicação

1. Acesse `http://localhost:3000`
2. Clique em "Criar Conta"
3. Preencha os dados de cadastro
4. Você será redirecionado para o Dashboard
5. Teste as funcionalidades:
   - Adicionar sites
   - Criar contas de email
   - Fazer upgrade de plano
   - Alterar configurações

## Solução de Problemas

### Porta 3000 já está em uso
Se a porta 3000 já estiver sendo usada, o Next.js irá automaticamente tentar a porta 3001, 3002, etc.

### Erros de TypeScript
Se você encontrar erros de TypeScript, verifique se está usando a versão correta do Node.js (18+):
```bash
node --version
```

### Limpar Cache
Se tiver problemas, tente limpar o cache:
```bash
rm -rf .next
npm run dev
```

## Desenvolvimento

Para alterações no código:
1. Faça as alterações nos arquivos
2. O Next.js irá automaticamente recarregar a página
3. As alterações são refletidas instantaneamente

## Política de Execução do PowerShell

Para entender melhor as políticas de execução:
- `Restricted` - Não permite scripts (padrão)
- `RemoteSigned` - Permite scripts locais, scripts da internet precisam ser assinados
- `Unrestricted` - Permite todos os scripts (não recomendado)

A configuração `RemoteSigned` é segura para desenvolvimento local.
