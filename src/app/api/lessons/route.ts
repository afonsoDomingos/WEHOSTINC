import { NextRequest, NextResponse } from 'next/server';
import { Lesson } from '@/lib/data';

let lessons: Lesson[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    
    const filteredLessons = moduleId 
      ? lessons.filter(l => l.moduleId === moduleId)
      : lessons;
      
    return NextResponse.json({ lessons: filteredLessons });
  } catch (error) {
    console.error('Erro ao buscar lições:', error);
    return NextResponse.json({ error: 'Erro ao buscar lições' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, lesson, lessonId } = body;

    if (action === 'create' && lesson) {
      const newLesson: Lesson = {
        ...lesson,
        id: `LESSON-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      lessons.unshift(newLesson);
      return NextResponse.json({ lesson: newLesson });
    }

    if (action === 'update' && lesson) {
      const index = lessons.findIndex(l => l.id === lesson.id);
      if (index === -1) {
        return NextResponse.json({ error: 'Lição não encontrada' }, { status: 404 });
      }
      lessons[index] = { ...lessons[index], ...lesson, updatedAt: new Date().toISOString() };
      return NextResponse.json({ lesson: lessons[index] });
    }

    if (action === 'delete' && lessonId) {
      const index = lessons.findIndex(l => l.id === lessonId);
      if (index === -1) {
        return NextResponse.json({ error: 'Lição não encontrada' }, { status: 404 });
      }
      lessons.splice(index, 1);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
}
