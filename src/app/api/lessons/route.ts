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
    console.log('[API Lessons] Iniciando POST request');
    await connectDB();
    console.log('[API Lessons] Conectado ao MongoDB');
    
    const body = await request.json();
    console.log('[API Lessons] Body recebido:', JSON.stringify(body, null, 2));
    
    const { action, lesson, lessonId } = body;

    if (action === 'create' && lesson) {
      console.log('[API Lessons] Criando nova lição:', lesson);
      
      const newLesson = new LessonModel({
        ...lesson,
        id: `LESSON-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('[API Lessons] Salvando lição no MongoDB...');
      await newLesson.save();
      console.log('[API Lessons] Lição salva com sucesso:', newLesson.id);
      
      return NextResponse.json({ lesson: newLesson });
    }

    if (action === 'update' && lesson) {
      console.log('[API Lessons] Atualizando lição:', lesson.id);
      
      // Limpar campos de video/material se hasVideo/hasMaterial for false
      const updateData: any = { ...lesson, updatedAt: new Date().toISOString() };
      if (!lesson.hasVideo) {
        updateData.videoUrl = undefined;
        updateData.videoTitle = undefined;
        updateData.videoDescription = undefined;
      }
      if (!lesson.hasMaterial) {
        updateData.materialUrl = undefined;
        updateData.materialTitle = undefined;
        updateData.materialType = undefined;
      }
      
      const updated = await LessonModel.findOneAndUpdate(
        { id: lesson.id },
        updateData,
        { new: true }
      );
      
      if (!updated) {
        console.error('[API Lessons] Lição não encontrada para atualização:', lesson.id);
        return NextResponse.json({ error: 'Lição não encontrada' }, { status: 404 });
      }
      
      console.log('[API Lessons] Lição atualizada com sucesso');
      return NextResponse.json({ lesson: updated });
    }

    if (action === 'delete' && lessonId) {
      console.log('[API Lessons] Deletando lição:', lessonId);
      
      const deleted = await LessonModel.findOneAndDelete({ id: lessonId });
      
      if (!deleted) {
        console.error('[API Lessons] Lição não encontrada para deleção:', lessonId);
        return NextResponse.json({ error: 'Lição não encontrada' }, { status: 404 });
      }
      
      console.log('[API Lessons] Lição deletada com sucesso');
      return NextResponse.json({ success: true });
    }

    console.error('[API Lessons] Ação inválida:', action);
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('[API Lessons] Erro ao processar requisição:', error);
    console.error('[API Lessons] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ error: 'Erro ao processar requisição', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
