import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CourseModel } from '@/lib/models/CourseModel';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const courses = await CourseModel.find({}).sort({ order: 1 });
    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Erro ao buscar cursos:', error);
    return NextResponse.json({ error: 'Erro ao buscar cursos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, course, courseId } = body;

    if (action === 'create' && course) {
      const newCourse = new CourseModel({
        ...course,
        id: `COURSE-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await newCourse.save();
      return NextResponse.json({ course: newCourse });
    }

    if (action === 'update' && course) {
      const updated = await CourseModel.findOneAndUpdate(
        { id: course.id },
        { ...course, updatedAt: new Date().toISOString() },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 });
      }
      return NextResponse.json({ course: updated });
    }

    if (action === 'delete' && courseId) {
      const deleted = await CourseModel.findOneAndDelete({ id: courseId });
      if (!deleted) {
        return NextResponse.json({ error: 'Curso não encontrado' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
}
