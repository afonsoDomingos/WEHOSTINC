import { NextRequest, NextResponse } from 'next/server';
import { CourseProgress } from '@/lib/data';

let progressList: CourseProgress[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    
    let filtered = progressList;
    
    if (userId) {
      filtered = filtered.filter(p => p.userId === userId);
    }
    
    if (courseId) {
      filtered = filtered.filter(p => p.courseId === courseId);
    }
    
    return NextResponse.json({ progress: filtered });
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    return NextResponse.json({ error: 'Erro ao buscar progresso' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, progress } = body;

    if (action === 'update' && progress) {
      const existingIndex = progressList.findIndex(
        p => p.userId === progress.userId && p.courseId === progress.courseId
      );
      
      if (existingIndex !== -1) {
        progressList[existingIndex] = { ...progressList[existingIndex], ...progress, updatedAt: new Date().toISOString() };
        return NextResponse.json({ progress: progressList[existingIndex] });
      } else {
        const newProgress: CourseProgress = {
          ...progress,
          id: `PROG-${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        progressList.push(newProgress);
        return NextResponse.json({ progress: newProgress });
      }
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
}
