import { NextRequest, NextResponse } from 'next/server';
import { Module } from '@/lib/data';

let modules: Module[] = [];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    
    const filteredModules = courseId 
      ? modules.filter(m => m.courseId === courseId)
      : modules;
      
    return NextResponse.json({ modules: filteredModules });
  } catch (error) {
    console.error('Erro ao buscar módulos:', error);
    return NextResponse.json({ error: 'Erro ao buscar módulos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, module, moduleId } = body;

    if (action === 'create' && module) {
      const newModule: Module = {
        ...module,
        id: `MODULE-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      modules.unshift(newModule);
      return NextResponse.json({ module: newModule });
    }

    if (action === 'update' && module) {
      const index = modules.findIndex(m => m.id === module.id);
      if (index === -1) {
        return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 });
      }
      modules[index] = { ...modules[index], ...module, updatedAt: new Date().toISOString() };
      return NextResponse.json({ module: modules[index] });
    }

    if (action === 'delete' && moduleId) {
      const index = modules.findIndex(m => m.id === moduleId);
      if (index === -1) {
        return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 });
      }
      modules.splice(index, 1);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json({ error: 'Erro ao processar requisição' }, { status: 500 });
  }
}
