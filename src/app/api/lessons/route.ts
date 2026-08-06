import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { LessonModel } from '@/lib/models/LessonModel';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const moduleId = searchParams.get('moduleId');
    
    let query: any = {};
    if (moduleId) {
      query.moduleId = moduleId;
    }
    
    const lessons = await LessonModel.find(query).sort({ order: 1 });
    return NextResponse.json({ lessons });
  } catch (error) {
    console.error('Erro ao buscar lições:', error);
    return NextResponse.json({ error: 'Erro ao buscar lições' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, lesson, lessonId } = body;

    if (action === 'create' && lesson) {
      const newLesson = new LessonModel({
        ...lesson,
        id: `LESSON-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await newLesson.save();
      return NextResponse.json({ lesson: newLesson });
    }

    if (action === 'update' && lesson) {
      const updated = await LessonModel.findOneAndUpdate(
        { id: lesson.id },
        { ...lesson, updatedAt: new Date().toISOString() },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json({ error: 'Lição não encontrada' }, { status: 404 });
      }
      return NextResponse.json({ lesson: updated });
    }

    if (action === 'delete' && lessonId) {
      const deleted = await LessonModel.findOneAndDelete({ id: lessonId });
      if (!deleted) {
        return NextResponse.json({ error: 'Lição não encontrada' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
}
