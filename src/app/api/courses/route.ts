import { NextRequest, NextResponse } from 'next/server';
import { Course } from '@/lib/data';

// Simular banco de dados em memória (em produção, usar MongoDB)
let courses: Course[] = [];

export async function GET(request: NextRequest) {
  try {
    // Em produção, buscar do MongoDB
    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    return NextResponse.json({ error: 'Erro ao buscar cursos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, course, courseId } = body;

    if (action === 'create' && course) {
      const newCourse: Course = {
        ...course,
        id: `COURSE-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      courses.unshift(newCourse);
      return NextResponse.json({ course: newCourse });
    }

    if (action === 'update' && course) {
      const index = courses.findIndex(c => c.id === course.id);
      if (index === -1) {
        return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 });
      }
      courses[index] = { ...courses[index], ...course, updatedAt: new Date().toISOString() };
      return NextResponse.json({ course: courses[index] });
    }

    if (action === 'delete' && courseId) {
      const index = courses.findIndex(c => c.id === courseId);
      if (index === -1) {
        return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 });
      }
      courses.splice(index, 1);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
}
