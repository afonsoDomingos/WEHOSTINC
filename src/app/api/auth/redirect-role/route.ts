import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { connectDB } from '@/lib/mongodb';
import UserModel from '@/lib/models/User';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const baseUrl = url.origin;

  try {
    const session = await getServerSession() as any;

    if (session?.user?.email) {
      await connectDB();
      const cleanEmail = session.user.email.toLowerCase().trim();
      const dbUser = await UserModel.findOne({
        $or: [
          { email: cleanEmail },
          { email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
        ]
      }).lean() as any;

      if (dbUser && (dbUser.role === 'admin' || dbUser.role === 'super_admin')) {
        console.log('[Auth Redirect] Redirecionando admin Google para /admin:', cleanEmail);
        return NextResponse.redirect(`${baseUrl}/admin`);
      }
    }
  } catch (error) {
    console.error('[Auth Redirect] Erro ao redirecionar por role:', error);
  }

  // Padrão para clientes
  return NextResponse.redirect(`${baseUrl}/dashboard`);
}
