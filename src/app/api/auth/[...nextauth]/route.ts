import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { sendWelcomeEmail } from '@/lib/sendgrid';

// Validar configuração do NextAuth
const requiredEnvVars = ['NEXTAUTH_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('[NextAuth] Variáveis de ambiente faltando:', missingEnvVars);
}

// 🔒 Header interno para autenticar chamadas server-side à /api/users
// Evita que o endpoint /api/users seja acessível publicamente por browsers externos
function getInternalHeaders(): Record<string, string> {
  const secret = process.env.NEXTAUTH_SECRET || '';
  return {
    'Content-Type': 'application/json',
    ...(secret ? { 'x-internal-auth': secret } : {}),
  };
}

export const GET = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          // 🔒 Solicitar apenas o mínimo necessário de permissões Google
          scope: 'openid email profile',
        },
      },
    }),
  ],
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    callbackUrl: {
      name: 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    state: {
      name: 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  callbacks: {
    async signIn({ user, account }: any) {
      // 🔒 Apenas processar login via Google OAuth
      if (account?.provider !== 'google') return false;

      if (!user.email) {
        console.error('[Google OAuth] ERRO: Email não fornecido pelo Google');
        return false;
      }

      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'https://wehosthere.com';
        const apiUrl = `${baseUrl}/api/users`;

        // Buscar utilizadores com autenticação interna (server-side)
        const usersResponse = await fetch(apiUrl, {
          headers: getInternalHeaders(),
        });

        if (!usersResponse.ok) {
          console.error('[Google OAuth] Falha ao buscar utilizadores:', usersResponse.status);
          return false;
        }

        const usersData = await usersResponse.json();
        const users = usersData.users || [];

        const existingUser = users.find(
          (u: any) => u.email.toLowerCase() === (user.email || '').toLowerCase()
        );

        if (existingUser) {
          // 🔒 Verificar se a conta está confirmada antes de permitir login
          if (existingUser.status === 'pending') {
            console.warn('[Google OAuth] Conta não confirmada — login bloqueado:', user.email);
            // Retornar false — o NextAuth irá redirecionar para pages.error (/login)
            // A página de login irá mostrar mensagem adequada via query param "error"
            return false;
          }

          // Utilizador ativo — permitir login
          return true;
        }

        // Utilizador novo — criar conta com status pending (requer confirmação)
        console.log('[Google OAuth] Criando novo utilizador:', user.email);

        const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const confirmationCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 horas

        const newUser = {
          id: `USER-${Date.now()}`,
          name: user.name || 'Utilizador Google',
          email: user.email,
          plan: 'none' as const,
          status: 'pending' as const, // Requer confirmação de email
          role: 'user' as const,
          avatar: user.image,
          createdAt: new Date().toISOString(),
          confirmationCode,
          confirmationCodeExpiresAt,
        };

        // Criar utilizador via API com autenticação interna
        const createResponse = await fetch(apiUrl, {
          method: 'POST',
          headers: getInternalHeaders(),
          body: JSON.stringify({ action: 'register', user: newUser }),
        });

        if (createResponse.ok) {
          console.log('[Google OAuth] Utilizador criado com sucesso:', user.email);
        } else {
          console.error('[Google OAuth] Falha ao criar utilizador via API');
        }

        // Enviar email de boas-vindas com código de confirmação
        sendWelcomeEmail(newUser.email, newUser.name, newUser.plan, confirmationCode).catch((err: any) => {
          console.error('[Google OAuth] Erro ao enviar email de boas-vindas:', err);
        });

        // 🔒 Retornar false — conta criada mas precisa de confirmação de email
        return false;
      } catch (error) {
        console.error('[Google OAuth] ERRO ao processar login:', error instanceof Error ? error.message : 'Erro desconhecido');
        return false;
      }
    },

    async session({ session, token }: any) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture;
      }
      return session;
    },

    async jwt({ token, user }: any) {
      if (user) {
        token.sub = user.id || token.sub;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      return token;
    },

    // 🔒 Validar callbackUrl para prevenir Open Redirect
    async redirect({ url, baseUrl }: any) {
      // Permitir apenas URLs relativas ou do mesmo domínio
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === new URL(baseUrl).origin) return url;
      } catch {
        // URL inválida — usar base
      }
      return baseUrl;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
});

export const POST = GET;
