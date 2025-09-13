// src/app/api/questions/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import * as XLSX from 'xlsx';
import type { Prisma } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// A = Question (required)
// B = Correct answer text (required; stored as choiceA + correct='A')
// C = Other option (required)
// D = Other option (optional)
// E = Other option (optional)
// F = Comment (optional)

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const subjectId = String(form.get('subjectId') || '');

    if (!file || !subjectId) {
      return NextResponse.json(
        { error: 'Missing file or subjectId.' },
        { status: 400 }
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (!rows || rows.length < 2) {
      return NextResponse.json(
        { error: 'Sheet is empty or missing data rows.' },
        { status: 400 }
      );
    }

    const dataRows = rows.slice(1);
    const problems: string[] = [];

    // 👇 Explicit typing fixes the build error on Vercel
    const writes: Prisma.PrismaPromise<unknown>[] = [];

    dataRows.forEach((r, i) => {
      const row = i + 2;

      const q = (r[0] ?? '').toString().trim();         // A
      const correctText = (r[1] ?? '').toString().trim(); // B
      const optC = r[2] != null ? r[2].toString().trim() : ''; // C
      const optD = r[3] != null ? r[3].toString().trim() : ''; // D (optional)
      const optE = r[4] != null ? r[4].toString().trim() : ''; // E (optional)
      const comment = r[5] != null ? r[5].toString().trim() : ''; // F (optional)

      // Validate required: A, B, C
      if (!q || !correctText || !optC) {
        problems.push(`Row ${row}: columns A, B and C are required.`);
        return;
      }

      writes.push(
        prisma.question.create({
          data: {
            subjectId,
            text: q,
            // store B (correct text) into A; mark A as correct
            choiceA: correctText,
            choiceB: optC || null,
            choiceC: optD || null,
            choiceD: optE || null,
            correct: 'A',
            comment: comment || null,
          },
        })
      );
    });

    if (writes.length === 0) {
      return NextResponse.json({ created: [], problems });
    }

    const created = await prisma.$transaction(writes);
    return NextResponse.json({ created, problems });
  } catch (err) {
    console.error('[IMPORT]', err);
    return NextResponse.json(
      { error: 'Import failed. See server logs.' },
      { status: 500 }
    );
  }
}