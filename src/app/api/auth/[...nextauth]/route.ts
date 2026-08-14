import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { auth } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/sendgrid';

export const GET = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }: any) {
      console.log('[Google OAuth] Sign in callback:', { user, account, profile });
      
      if (!user.email) {
        console.log('[Google OAuth] Email não fornecido pelo Google');
        return false;
      }

      try {
        const users = await auth.fetchUsersAsync();
        const existingUser = users.find((u: any) => u.email.toLowerCase() === (user.email || '').toLowerCase());

        if (existingUser) {
          console.log('[Google OAuth] Usuário existente encontrado:', existingUser.email);
          return true;
        }

        const newUser = {
          id: `USER-${Date.now()}`,
          name: user.name || 'Usuário Google',
          email: user.email,
          plan: 'none' as const,
          status: 'active' as const,
          role: 'user' as const,
          avatar: user.image,
          createdAt: new Date().toISOString()
        };

        console.log('[Google OAuth] Criando novo usuário:', newUser.email);
        
        if (typeof window !== 'undefined') {
          const key = `user_${newUser.id}`;
          localStorage.setItem(key, JSON.stringify(newUser));
        }

        sendWelcomeEmail(newUser.email, newUser.name, newUser.plan).catch((err: any) => {
          console.error('[Google OAuth] Erro ao enviar email de boas-vindas:', err);
        });

        return true;
      } catch (error) {
        console.error('[Google OAuth] Erro ao criar usuário:', error);
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
});

export const POST = GET;
