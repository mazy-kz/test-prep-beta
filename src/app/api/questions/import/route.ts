// src/app/api/questions/import/route.ts
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/server/db';
import type { Prisma } from '@prisma/client';

type Letter = 'A' | 'B' | 'C' | 'D';

function asStr(v: unknown): string {
  if (v === undefined || v === null) return '';
  return String(v).trim();
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const subjectId = asStr(form.get('subjectId'));
    const file = form.get('file');

    if (!subjectId) {
      return NextResponse.json({ ok: false, error: 'Missing subjectId.' }, { status: 400 });
    }
    if (!(file instanceof Blob)) {
      return NextResponse.json({ ok: false, error: 'No file uploaded.' }, { status: 400 });
    }

    // Read the file into XLSX
    const buf = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: 'buffer' });
    const firstSheetName = wb.SheetNames[0];
    if (!firstSheetName) {
      return NextResponse.json({ ok: false, error: 'Workbook has no sheets.' }, { status: 400 });
    }
    const sheet = wb.Sheets[firstSheetName];

    // rows as arrays; defval ensures empty cells become ""
    const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
      range: 0,
    }) as unknown[][];

    // If the user left a header row, try to detect and drop it
    const looksLikeHeader = (r: unknown[]) => {
      const a = asStr(r[0]).toLowerCase();
      const b = asStr(r[1]).toLowerCase();
      return a.includes('question') || b.includes('correct');
    };
    const data = rows.filter((r) => r.length > 0);
    if (data.length && looksLikeHeader(data[0])) data.shift();

    const problems: string[] = [];
    const batch: Prisma.QuestionCreateManyInput[] = [];

    data.forEach((r, i) => {
      const row = i + 2; // close enough even if there wasn't a header
      const q = asStr(r[0]);               // Column A - Question (required)
      const correctText = asStr(r[1]);     // Column B - Correct answer text (required)
      const other1 = asStr(r[2]);          // Column C - Wrong option (required)
      const other2 = asStr(r[3]);          // Column D - Wrong option (optional)
      const other3 = asStr(r[4]);          // Column E - Wrong option (optional)
      const comment = asStr(r[5]) || null; // Column F - Comment (optional)

      // Basic validation: need question, correct, and at least one other option
      if (!q || !correctText || !other1) {
        problems.push(`Row ${row}: missing required fields (A=question, B=correct, C=other).`);
        return;
      }

      // Build options: put correct first so 'A' is always the correct letter.
      // Remove empty & duplicate options while preserving order.
      const options = [correctText, other1, other2, other3]
        .map((s) => asStr(s))
        .filter((s, idx, arr) => s !== '' && arr.indexOf(s) === idx);

      if (options.length < 2) {
        problems.push(`Row ${row}: not enough distinct options after cleaning.`);
        return;
      }
      if (options.length > 4) options.length = 4; // safety, though we only ever add up to 4

      const [choiceA, choiceB, choiceCVal, choiceDVal] = [
        options[0] ?? '',
        options[1] ?? '',
        options[2] ?? '',
        options[3] ?? '',
      ];

      // Prisma schema requires choiceC to be a non-null string.
      // choiceD is optional in schema, so we can store null if it doesn't exist.
      const item: Prisma.QuestionCreateManyInput = {
        subjectId,
        text: q,
        choiceA,
        choiceB,
        choiceC: choiceCVal || '', // *** MUST be string, not null ***
        choiceD: choiceDVal ? choiceDVal : null,
        correct: 'A' as Letter, // correct is always 'A' because we placed the correct text first
        comment,
      };

      batch.push(item);
    });

    if (batch.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No valid rows to import.', problems },
        { status: 400 }
      );
    }

    // Insert in chunks to avoid exceeding limits
    const CHUNK = 500;
    for (let i = 0; i < batch.length; i += CHUNK) {
      await prisma.question.createMany({
        data: batch.slice(i, i + CHUNK),
      });
    }

    return NextResponse.json({ ok: true, created: batch.length, problems });
  } catch (err) {
    console.error('Import failed:', err);
    return NextResponse.json({ error: 'Import failed. See server logs.' }, { status: 500 });
  }
}