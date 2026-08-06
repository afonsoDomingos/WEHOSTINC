import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Certificate } from '@/lib/models/Certificate';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    const certificateNumber = searchParams.get('certificateNumber');
    
    let query: any = {};
    
    if (userId) {
      query.userId = userId;
    }
    
    if (courseId) {
      query.courseId = courseId;
    }
    
    if (certificateNumber) {
      query.certificateNumber = certificateNumber;
    }
    
    const certificates = await Certificate.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json({ certificates });
  } catch (error) {
    console.error('Erro ao buscar certificados:', error);
    return NextResponse.json({ error: 'Erro ao buscar certificados' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, certificate } = body;

    if (action === 'create' && certificate) {
      // Check if certificate already exists
      const existing = await Certificate.findOne({
        userId: certificate.userId,
        courseId: certificate.courseId
      });
      
      if (existing) {
        return NextResponse.json({ certificate: existing });
      }
      
      const newCertificate = new Certificate({
        ...certificate,
        id: `CERT-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString()
      });
      await newCertificate.save();
      return NextResponse.json({ certificate: newCertificate });
    }

    if (action === 'verify' && body.certificateNumber) {
      const certificate = await Certificate.findOne({ certificateNumber: body.certificateNumber });
      if (!certificate) {
        return NextResponse.json({ valid: false, message: 'Certificado não encontrado' }, { status: 404 });
      }
      return NextResponse.json({ valid: true, certificate });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
}
