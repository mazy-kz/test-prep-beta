import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export const runtime = 'nodejs';       // Ensure Node runtime (not Edge)
export const dynamic = 'force-dynamic'; // Don’t prerender

export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true },
    });
    return NextResponse.json(subjects);
  } catch (e: any) {
    console.error('GET /api/subjects error:', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const subject = await prisma.subject.create({
      data: { name: name.trim() },
      select: { id: true, name: true },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (e: any) {
    console.error('POST /api/subjects error:', e?.message ?? e);
    return NextResponse.json({ error: e?.message ?? 'Server error' }, { status: 500 });
  }
}