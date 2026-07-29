import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum ficheiro fornecido' }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dnvnftvky';
    const apiKey = process.env.CLOUDINARY_API_KEY || '259851568455899';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '3hRsXzUVd3pnwn9IKQWN7UAeJLc';

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const strToSign = `timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

    const cloudinaryFormData = new FormData();
    cloudinaryFormData.append('file', file);
    cloudinaryFormData.append('api_key', apiKey);
    cloudinaryFormData.append('timestamp', timestamp);
    cloudinaryFormData.append('signature', signature);

    // Tentar upload direto na API REST do Cloudinary
    try {
      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
        {
          method: 'POST',
          body: cloudinaryFormData
        }
      );

      if (cloudinaryRes.ok) {
        const data = await cloudinaryRes.json();
        const fileType = file.type.startsWith('image/')
          ? 'image'
          : file.type === 'application/pdf' || file.name.endsWith('.pdf')
          ? 'pdf'
          : 'file';

        return NextResponse.json({
          success: true,
          url: data.secure_url || data.url,
          name: file.name,
          type: fileType,
          format: data.format,
          bytes: data.bytes
        });
      }
    } catch (apiError) {
      console.warn('Falha no upload direto para Cloudinary, usando fallback:', apiError);
    }

    // Fallback gracioso usando Data URL se a chamada externa falhar
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'application/octet-stream';
    const base64Url = `data:${mimeType};base64,${buffer.toString('base64')}`;

    const fileType = mimeType.startsWith('image/')
      ? 'image'
      : mimeType === 'application/pdf' || file.name.endsWith('.pdf')
      ? 'pdf'
      : 'file';

    return NextResponse.json({
      success: true,
      url: base64Url,
      name: file.name,
      type: fileType,
      bytes: buffer.length
    });
  } catch (error) {
    console.error('Erro na API de upload:', error);
    return NextResponse.json({ error: 'Erro interno ao processar o upload do ficheiro' }, { status: 500 });
  }
}
