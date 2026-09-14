import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.clone();
  const baseUrl = url.origin;

  try {
    const secret = process.env.NEXTAUTH_SECRET;
    const token = await getToken({ req, secret });

    console.log('[Auth Redirect] Token lido do cookie:', { email: token?.email, role: token?.role });

    const email = token?.email?.toLowerCase().trim();

    if (email) {
      await connectDB();
      const dbUser = await UserModel.findOne({
        $or: [
          { email },
          { email: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
        ]
      }).lean() as any;

      if (dbUser && (dbUser.role === 'admin' || dbUser.role === 'super_admin')) {
        console.log('[Auth Redirect] ✅ Admin confirmado no MongoDB. Redirecionando para /admin:', email);
        return NextResponse.redirect(`${baseUrl}/admin`);
      }
    }
  } catch (error) {
    console.error('[Auth Redirect] ❌ Erro no redirecionador por role:', error);
  }

  console.log('[Auth Redirect] Redirecionando para /dashboard (cliente)');
  return NextResponse.redirect(`${baseUrl}/dashboard`);
}
