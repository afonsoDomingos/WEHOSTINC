import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import MarketingMaterial from '@/lib/models/MarketingMaterial';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const materials = await MarketingMaterial.find()
      .sort({ createdAt: -1 });

    return NextResponse.json({ 
      success: true, 
      materials
    });

  } catch (error) {
    console.error('Erro ao buscar materiais:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao buscar materiais' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { 
      title, 
      description, 
      type, 
      content, 
      imageUrl, 
      imageUrlDark, 
      dimensions, 
      platform, 
      category, 
      language,
      createdBy 
    } = body;

    if (!title || !description || !type || !content || !category || !createdBy) {
      return NextResponse.json({ 
        success: false, 
        error: 'Campos obrigatórios: title, description, type, content, category, createdBy' 
      }, { status: 400 });
    }

    const material = await MarketingMaterial.create({
      title,
      description,
      type,
      content,
      imageUrl,
      imageUrlDark,
      dimensions,
      platform,
      category,
      language: language || 'pt',
      isActive: true,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      material 
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar material:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao criar material' 
    }, { status: 500 });
  }
}
