import { NextRequest, NextResponse } from 'next/server';
import { CourseEnrollment } from '@/lib/data';

let enrollments: CourseEnrollment[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    
    let filtered = enrollments;
    
    if (userId) {
      filtered = filtered.filter(e => e.userId === userId);
    }
    
    if (courseId) {
      filtered = filtered.filter(e => e.courseId === courseId);
    }
    
    return NextResponse.json({ enrollments: filtered });
  } catch (error) {
    console.error('Erro ao buscar inscrições:', error);
    return NextResponse.json({ error: 'Erro ao buscar inscrições' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, enrollment } = body;

    if (action === 'create' && enrollment) {
      const newEnrollment: CourseEnrollment = {
        ...enrollment,
        id: `ENROLL-${Math.floor(1000 + Math.random() * 9000)}`,
        enrolledAt: new Date().toISOString()
      };
      enrollments.unshift(newEnrollment);
      return NextResponse.json({ enrollment: newEnrollment });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
}
