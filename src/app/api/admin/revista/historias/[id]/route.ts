import { NextResponse } from 'next/server';
import { getStoryById, updateStory, deleteStory } from '@/lib/revistaData';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const story = await getStoryById(params.id);
    if (!story) return NextResponse.json({ error: 'História não encontrada' }, { status: 404 });
    return NextResponse.json({ success: true, story });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const result = await updateStory(params.id, body);
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'História não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, story: result.story });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const result = await deleteStory(params.id);
    return NextResponse.json({ success: result.success });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
