import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CourseModel } from '@/lib/models/CourseModel';
import { ModuleModel } from '@/lib/models/ModuleModel';
import { LessonModel } from '@/lib/models/LessonModel';
import { ensureAcademySeeded } from '@/lib/serverSeedAcademy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    await ensureAcademySeeded();
    const courses = await CourseModel.find({}).sort({ order: 1 });
    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    return NextResponse.json({ error: 'Erro ao buscar cursos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API Courses] Iniciando POST request');
    await connectDB();
    console.log('[API Courses] Conectado ao MongoDB');
    
    const body = await request.json();
    console.log('[API Courses] Body recebido:', JSON.stringify(body, null, 2));
    
    const { action, course, courseId } = body;

    if (action === 'create' && course) {
      console.log('[API Courses] Criando novo curso:', course);
      
      const newCourse = new CourseModel({
        ...course,
        id: `COURSE-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('[API Courses] Salvando curso no MongoDB...');
      await newCourse.save();
      console.log('[API Courses] Curso salvo com sucesso:', newCourse.id);
      
      return NextResponse.json({ course: newCourse });
    }

    if (action === 'update' && course) {
      console.log('[API Courses] Atualizando curso:', course.id);
      
      const updated = await CourseModel.findOneAndUpdate(
        { id: course.id },
        { ...course, updatedAt: new Date().toISOString() },
        { new: true }
      );
      
      if (!updated) {
        console.error('[API Courses] Curso não encontrado para atualização:', course.id);
        return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 });
      }
      
      console.log('[API Courses] Curso atualizado com sucesso');
      return NextResponse.json({ course: updated });
    }

    if (action === 'delete' && courseId) {
      console.log('[API Courses] Deletando curso:', courseId);
      
      // Verificar se o curso existe antes de deletar
      const courseExists = await CourseModel.findOne({ id: courseId });
      console.log('[API Courses] Curso existe?', !!courseExists);
      if (courseExists) {
        console.log('[API Courses] Curso encontrado:', courseExists.id, courseExists.title);
      }
      
      // Deletar em cascade: primeiro lições, depois módulos, depois curso
      const modules = await ModuleModel.find({ courseId });
      const moduleIds = modules.map(m => m.id);
      
      console.log('[API Courses] Módulos encontrados:', modules.length);
      console.log('[API Courses] IDs dos módulos:', moduleIds);
      
      console.log('[API Courses] Deletando lições dos módulos:', moduleIds.length, 'módulos');
      const lessonsDeleted = await LessonModel.deleteMany({ moduleId: { $in: moduleIds } });
      console.log('[API Courses] Lições deletadas:', lessonsDeleted.deletedCount);
      
      console.log('[API Courses] Deletando módulos:', modules.length);
      const modulesDeleted = await ModuleModel.deleteMany({ courseId });
      console.log('[API Courses] Módulos deletados:', modulesDeleted.deletedCount);
      
      const deleted = await CourseModel.findOneAndDelete({ id: courseId });
      
      if (!deleted) {
        console.error('[API Courses] Curso não encontrado para deleção:', courseId);
        return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 });
      }
      
      console.log('[API Courses] Curso e dados relacionados deletados com sucesso');
      console.log('[API Courses] Curso deletado:', deleted.id, deleted.title);
      return NextResponse.json({ success: true, deletedCourse: deleted.id, deletedModules: modulesDeleted.deletedCount, deletedLessons: lessonsDeleted.deletedCount });
    }

    console.error('[API Courses] Ação inválida:', action);
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('[API Courses] Erro ao processar requisição:', error);
    console.error('[API Courses] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ error: 'Erro ao processar requisição', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
