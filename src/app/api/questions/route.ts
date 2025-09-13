import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/questions?subjectId=...
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const subjectId = url.searchParams.get('subjectId') || '';
    if (!subjectId) {
      return NextResponse.json({ error: 'subjectId is required' }, { status: 400 });
    }
    const questions = await prisma.question.findMany({
      where: { subjectId },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(questions);
  } catch (e: any) {
    console.error('[GET /api/questions] ', e);
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }
}

// POST /api/questions
// body: { subjectId, text, choiceA, choiceB, choiceC, choiceD?, correct: 'A'|'B'|'C'|'D', comment? }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const subjectId = String(body?.subjectId ?? '').trim();
    const text      = String(body?.text ?? '').trim();
    const choiceA   = String(body?.choiceA ?? '').trim();
    const choiceB   = String(body?.choiceB ?? '').trim();
    const choiceC   = String(body?.choiceC ?? '').trim();
    const choiceD   = (body?.choiceD ?? '') === '' ? null : String(body?.choiceD);
    const correct   = String(body?.correct ?? 'A').toUpperCase();
    const comment   = (body?.comment ?? '') === '' ? null : String(body?.comment);

    if (!subjectId) return NextResponse.json({ error: 'subjectId required' }, { status: 400 });
    if (!text)      return NextResponse.json({ error: 'Question text required' }, { status: 400 });
    if (!choiceA || !choiceB || !choiceC)
      return NextResponse.json({ error: 'Choices A, B, C are required' }, { status: 400 });
    if (!['A', 'B', 'C', 'D'].includes(correct))
      return NextResponse.json({ error: 'correct must be A, B, C or D' }, { status: 400 });

    const created = await prisma.question.create({
      data: { subjectId, text, choiceA, choiceB, choiceC, choiceD, correct, comment },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    console.error('[POST /api/questions] ', e);
    return NextResponse.json({ error: 'Failed to create question' }, { status: 400 });
  }
}
