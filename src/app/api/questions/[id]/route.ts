import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Optional: fetch a single question
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const q = await prisma.question.findUnique({ where: { id: params.id } });
    if (!q) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(q);
  } catch (e: any) {
    console.error('[GET /api/questions/:id]', e);
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 400 });
  }
}

// Update an existing question
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      text,
      choiceA,
      choiceB,
      choiceC,
      choiceD,
      correct,
      comment,
      subjectId, // ignored if sent
    } = body ?? {};

    const updated = await prisma.question.update({
      where: { id: params.id },
      data: { text, choiceA, choiceB, choiceC, choiceD, correct, comment },
    });

    return NextResponse.json(updated);
  } catch (e: any) {
    console.error('[PATCH /api/questions/:id]', e);
    return NextResponse.json({ error: e?.message || 'Update failed' }, { status: 400 });
  }
}

// Delete a question
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.question.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('[DELETE /api/questions/:id]', e);
    return NextResponse.json({ error: e?.message || 'Delete failed' }, { status: 400 });
  }
}
