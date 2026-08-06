import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ModuleModel } from '@/lib/models/ModuleModel';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    
    let query: any = {};
    if (courseId) {
      query.courseId = courseId;
    }
    
    const modules = await ModuleModel.find(query).sort({ order: 1 });
    return NextResponse.json({ modules });
  } catch (error) {
    console.error('Erro ao buscar módulos:', error);
    return NextResponse.json({ error: 'Erro ao buscar módulos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { action, module, moduleId } = body;

    if (action === 'create' && module) {
      const newModule = new ModuleModel({
        ...module,
        id: `MODULE-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      await newModule.save();
      return NextResponse.json({ module: newModule });
    }

    if (action === 'update' && module) {
      const updated = await ModuleModel.findOneAndUpdate(
        { id: module.id },
        { ...module, updatedAt: new Date().toISOString() },
        { new: true }
      );
      if (!updated) {
        return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 });
      }
      return NextResponse.json({ module: updated });
    }

    if (action === 'delete' && moduleId) {
      const deleted = await ModuleModel.findOneAndDelete({ id: moduleId });
      if (!deleted) {
        return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
}
