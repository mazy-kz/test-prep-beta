import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET() {
  try {
    const [version] = await prisma.$queryRawUnsafe<any[]>('select version()');
    const subjects = await prisma.subject.findMany({ take: 1 });
    return NextResponse.json({
      ok: true,
      dbVersion: version?.version ?? 'unknown',
      subjectsCountSample: subjects.length,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err?.message ?? String(err) }, { status: 500 });
  }
}