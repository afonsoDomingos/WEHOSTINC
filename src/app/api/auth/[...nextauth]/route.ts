import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { auth } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/sendgrid';

// Validar configuração do NextAuth
const requiredEnvVars = ['NEXTAUTH_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('[NextAuth] Variáveis de ambiente faltando:', missingEnvVars);
}

export const GET = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      console.log('[Google OAuth] Sign in callback iniciado:', { user, account, profile });
      
      if (!user.email) {
        console.error('[Google OAuth] ERRO: Email não fornecido pelo Google');
        return false;
      }

      try {
        console.log('[Google OAuth] Tentando buscar usuários...');
        const users = await auth.fetchUsersAsync();
        console.log('[Google OAuth] Usuários buscados com sucesso, total:', users.length);
        
        const existingUser = users.find((u: any) => u.email.toLowerCase() === (user.email || '').toLowerCase());

        if (existingUser) {
          console.log('[Google OAuth] Usuário existente encontrado:', existingUser.email);
          
          // Verificar se a conta está confirmada
          if (existingUser.status === 'pending') {
            console.warn('[Google OAuth] Conta não confirmada, redirecionando para tela de confirmação');
            // Redirecionar para tela de confirmação em vez de fazer login
            return '/confirm-email?email=' + encodeURIComponent(user.email);
          }
          
          return true;
        }

        console.log('[Google OAuth] Criando novo usuário para:', user.email);

        // Gerar código de confirmação de 6 dígitos
        const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const newUser = {
          id: `USER-${Date.now()}`,
          name: user.name || 'Usuário Google',
          email: user.email,
          plan: 'none' as const,
          status: 'pending' as const, // Criar como pending para requerer confirmação
          role: 'user' as const,
          avatar: user.image,
          createdAt: new Date().toISOString(),
          confirmationCode
        };

        console.log('[Google OAuth] Dados do novo usuário:', newUser);
        
        // Criar usuário via API em vez de localStorage
        try {
          // Usar URL absoluta no servidor-side
          const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'https://wehosthere.com';
          const apiUrl = `${baseUrl}/api/users`;
          
          const apiResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
          });
          
          if (apiResponse.ok) {
            console.log('[Google OAuth] Usuário criado via API com sucesso');
          } else {
            console.warn('[Google OAuth] Falha ao criar usuário via API, tentando localStorage fallback');
            // Fallback para localStorage se a API falhar
            if (typeof window !== 'undefined') {
              const key = `user_${newUser.id}`;
              localStorage.setItem(key, JSON.stringify(newUser));
            }
          }
        } catch (apiError) {
          console.warn('[Google OAuth] Erro na API, usando localStorage fallback:', apiError);
          // Fallback para localStorage se a API falhar
          if (typeof window !== 'undefined') {
            const key = `user_${newUser.id}`;
            localStorage.setItem(key, JSON.stringify(newUser));
          }
        }

        console.log('[Google OAuth] Enviando email de boas-vindas...');
        sendWelcomeEmail(newUser.email, newUser.name, newUser.plan, confirmationCode).catch((err: any) => {
          console.error('[Google OAuth] Erro ao enviar email de boas-vindas:', err);
        });

        console.log('[Google OAuth] Usuário criado com sucesso, redirecionando para tela de confirmação:', newUser.email);
        // Redirecionar para tela de confirmação em vez de fazer login
        return '/confirm-email?email=' + encodeURIComponent(newUser.email);
      } catch (error) {
        console.error('[Google OAuth] ERRO CRÍTICO ao processar login:', error);
        console.error('[Google OAuth] Detalhes do erro:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : undefined
        });
        return false;
      }
    },
    async session({ session, token }: any) {
      console.log('[Google OAuth] Session callback:', { session, token });
      
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.picture;
      }
      
      return session;
    },
    async jwt({ token, user }: any) {
      console.log('[Google OAuth] JWT callback:', { token, user });
      
      if (user) {
        token.sub = user.id || token.sub;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      
      return token;
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
