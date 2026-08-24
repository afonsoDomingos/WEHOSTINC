import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MarketingMaterial from '@/lib/models/MarketingMaterial';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Verificar autorização admin
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer admin-secret`) {
      console.error('PATCH /api/admin/affiliates/materials/[id] - Unauthorized');
      return NextResponse.json({ 
        success: false, 
        error: 'Não autorizado' 
      }, { status: 401 });
    }
    
    const body = await request.json();
    const { id } = params;

    const material = await MarketingMaterial.findByIdAndUpdate(
      id,
      { 
        ...body, 
        updatedAt: new Date().toISOString() 
      },
      { new: true }
    );

    if (!material) {
      return NextResponse.json({ success: false, error: 'Material não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, material });

  } catch (error) {
    console.error('Erro ao atualizar material:', error);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar material' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    
    // Verificar autorização admin
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer admin-secret`) {
      console.error('DELETE /api/admin/affiliates/materials/[id] - Unauthorized');
      return NextResponse.json({ 
        success: false, 
        error: 'Não autorizado' 
      }, { status: 401 });
    }
    
    const { id } = params;

    const material = await MarketingMaterial.findByIdAndDelete(id);

    if (!material) {
      return NextResponse.json({ success: false, error: 'Material não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Material excluído com sucesso' });

  } catch (error) {
    console.error('Erro ao excluir material:', error);
    return NextResponse.json({ success: false, error: 'Erro ao excluir material' }, { status: 500 });
  }
}
