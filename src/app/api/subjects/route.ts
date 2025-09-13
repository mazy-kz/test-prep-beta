// src/app/api/subjects/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

// Prisma requires Node.js runtime (not Edge) on Vercel
export const runtime = 'nodejs';

export async function GET() {
  try {
    const items = await prisma.subject.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(items, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Failed to get subjects' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    // Make sure the body is valid JSON and contains a "name"
    const body = await req.json().catch(() => ({}));
    const rawName = typeof body?.name === 'string' ? body.name : '';
    const name = rawName.trim();

    if (!name) {
      return NextResponse.json(
        { error: 'Field "name" is required.' },
        { status: 400 }
      );
    }

    const created = await prisma.subject.create({
      data: { name },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err: any) {
    // Unique name violation
    if (err?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Subject with this name already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: err?.message ?? 'Failed to create subject' },
      { status: 500 }
    );
  }
}