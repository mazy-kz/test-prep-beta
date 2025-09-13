import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export const runtime = 'nodejs';

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function POST(req: Request) {
  const { subjectId, mode, revealMode } = await req.json();
  if (!subjectId) return NextResponse.json({ error: 'subjectId required' }, { status: 400 });
  if (!['forty', 'all'].includes(mode)) return NextResponse.json({ error: 'mode invalid' }, { status: 400 });
  if (!['immediate', 'end'].includes(revealMode)) return NextResponse.json({ error: 'revealMode invalid' }, { status: 400 });

  const all = await prisma.question.findMany({ where: { subjectId } });
  if (all.length === 0) {
    return NextResponse.json({ error: 'This subject has no questions yet.' }, { status: 400 });
  }

  const quantity = mode === 'all' ? all.length : Math.min(40, all.length);
  const qshuf = shuffle([...all]).slice(0, quantity);
  const responsesCreate = qshuf.map((q) => {
    const letters = (['A', 'B', 'C', 'D'] as const).filter((l) => (q as any)['choice' + l]);
    const order = shuffle([...letters]).join('');
    return { questionId: q.id, order };
  });

  const session = await prisma.testSession.create({
    data: { subjectId, revealMode, quantity, responses: { create: responsesCreate } },
    include: { responses: true },
  });

  return NextResponse.json(session);
}
