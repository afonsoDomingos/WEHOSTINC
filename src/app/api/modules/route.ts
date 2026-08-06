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
    console.log('[API Modules] Iniciando POST request');
    await connectDB();
    console.log('[API Modules] Conectado ao MongoDB');
    
    const body = await request.json();
    console.log('[API Modules] Body recebido:', JSON.stringify(body, null, 2));
    
    const { action, module, moduleId } = body;

    if (action === 'create' && module) {
      console.log('[API Modules] Criando novo módulo:', module);
      
      const newModule = new ModuleModel({
        ...module,
        id: `MODULE-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log('[API Modules] Salvando módulo no MongoDB...');
      await newModule.save();
      console.log('[API Modules] Módulo salvo com sucesso:', newModule.id);
      
      return NextResponse.json({ module: newModule });
    }

    if (action === 'update' && module) {
      console.log('[API Modules] Atualizando módulo:', module.id);
      console.log('[API Modules] Dados recebidos:', JSON.stringify(module, null, 2));
      
      // Limpar campos de video/material apenas se hasVideo/hasMaterial for false explicitamente
      const updateData: any = { ...module, updatedAt: new Date().toISOString() };
      if (module.hasVideo === false) {
        updateData.videoUrl = undefined;
        updateData.videoTitle = undefined;
        updateData.videoDescription = undefined;
      }
      if (module.hasMaterial === false) {
        updateData.materialUrl = undefined;
        updateData.materialTitle = undefined;
        updateData.materialType = undefined;
      }
      
      console.log('[API Modules] Dados para update:', JSON.stringify(updateData, null, 2));
      
      const updated = await ModuleModel.findOneAndUpdate(
        { id: module.id },
        updateData,
        { new: true }
      );
      
      if (!updated) {
        console.error('[API Modules] Módulo não encontrado para atualização:', module.id);
        return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 });
      }
      
      console.log('[API Modules] Módulo atualizado com sucesso');
      return NextResponse.json({ module: updated });
    }

    if (action === 'delete' && moduleId) {
      console.log('[API Modules] Deletando módulo:', moduleId);
      
      const deleted = await ModuleModel.findOneAndDelete({ id: moduleId });
      
      if (!deleted) {
        console.error('[API Modules] Módulo não encontrado para deleção:', moduleId);
        return NextResponse.json({ error: 'Módulo não encontrado' }, { status: 404 });
      }
      
      console.log('[API Modules] Módulo deletado com sucesso');
      return NextResponse.json({ success: true });
    }

    console.error('[API Modules] Ação inválida:', action);
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('[API Modules] Erro ao processar requisição:', error);
    console.error('[API Modules] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json({ error: 'Erro ao processar requisição', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
