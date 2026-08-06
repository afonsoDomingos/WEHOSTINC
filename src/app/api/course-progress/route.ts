import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { CourseProgress } from '@/lib/models/CourseProgress';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const courseId = searchParams.get('courseId');
    
    let query: any = {};
    
    if (userId) {
      query.userId = userId;
    }
    
    if (courseId) {
      query.courseId = courseId;
    }
    
    const progress = await CourseProgress.find(query).sort({ updatedAt: -1 });
    
    return NextResponse.json({ progress });
  } catch (error) {
    console.error('Erro ao buscar progresso:', error);
    return NextResponse.json({ error: 'Erro ao buscar progresso' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, progress } = body;

    if (action === 'update' && progress) {
      const existing = await CourseProgress.findOne({
        userId: progress.userId,
        courseId: progress.courseId
      });
      
      if (existing) {
        const updated = await CourseProgress.findOneAndUpdate(
          { userId: progress.userId, courseId: progress.courseId },
          { 
            ...progress, 
            updatedAt: new Date().toISOString() 
          },
          { new: true }
        );
        return NextResponse.json({ progress: updated });
      } else {
        const newProgress = new CourseProgress({
          ...progress,
          id: `PROG-${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await newProgress.save();
        return NextResponse.json({ progress: newProgress });
      }
    }

    if (action === 'complete_lesson' && progress) {
      const existing = await CourseProgress.findOne({
        userId: progress.userId,
        courseId: progress.courseId
      });
      
      if (existing) {
        const updated = await CourseProgress.findOneAndUpdate(
          { userId: progress.userId, courseId: progress.courseId },
          { 
            $addToSet: { completedLessons: progress.lessonId },
            currentLessonId: progress.currentLessonId,
            currentModuleId: progress.currentModuleId,
            lastAccessedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          { new: true }
        );
        return NextResponse.json({ progress: updated });
      } else {
        const newProgress = new CourseProgress({
          id: `PROG-${Math.floor(1000 + Math.random() * 9000)}`,
          userId: progress.userId,
          courseId: progress.courseId,
          completedLessons: [progress.lessonId],
          currentLessonId: progress.currentLessonId,
          currentModuleId: progress.currentModuleId,
          lastAccessedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        await newProgress.save();
        return NextResponse.json({ progress: newProgress });
      }
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
}
