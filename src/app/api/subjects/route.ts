import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json(subjects);
  } catch (err: any) {
    console.error('[GET /api/subjects]', err);
    return NextResponse.json({ error: 'Failed to list subjects' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json().catch(() => ({}));
    const clean = (name ?? '').toString().trim();
    if (!clean) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const s = await prisma.subject.create({ data: { name: clean } });
    return NextResponse.json(s, { status: 201 });
  } catch (err: any) {
    console.error('[POST /api/subjects]', err);
    const msg = err?.code === 'P2002' ? 'A subject with this name already exists' : 'Failed to create subject';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
