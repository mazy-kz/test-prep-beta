/* eslint-disable import/no-extraneous-dependencies */
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { prisma } from '@/server/db';

// IMPORTANT: XLSX needs Node runtime (not Edge) on Vercel
export const runtime = 'nodejs';

// If your imports may take longer than default, you can optionally lift this:
// export const maxDuration = 60; // seconds (Vercel Pro+)

type Letter = 'A' | 'B' | 'C' | 'D';

// Make a letter from index (0->A, 1->B, 2->C, 3->D)
function idxToLetter(i: number): Letter {
  return (['A', 'B', 'C', 'D'] as const)[i];
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const subjectId = (form.get('subjectId') as string | null)?.trim() || '';

    if (!subjectId) {
      return NextResponse.json(
        { ok: false, message: 'Missing subjectId.' },
        { status: 400 }
      );
    }

    if (!file) {
      return NextResponse.json(
        { ok: false, message: 'Missing file.' },
        { status: 400 }
      );
    }

    // Read uploaded XLSX file into a Buffer
    const buf = Buffer.from(await file.arrayBuffer());

    // Parse workbook
    const workbook = XLSX.read(buf, { type: 'buffer' });
    // Use the first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        { ok: false, message: 'No sheets found in the workbook.' },
        { status: 400 }
      );
    }
    const sheet = workbook.Sheets[sheetName];

    // Convert to a 2D array (raw values)
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { ok: false, message: 'Sheet appears to be empty.' },
        { status: 400 }
      );
    }

    // If first row looks like a header, you can drop it automatically.
    // We’ll keep it simple: if the first row contains the word "question" (case-insensitive) in col A, drop it.
    const firstRow = rows[0] ?? [];
    const firstA = String(firstRow[0] ?? '').toLowerCase();
    const startIdx = firstA.includes('question') ? 1 : 0;

    const problems: string[] = [];
    const toCreate: {
      subjectId: string;
      text: string;
      choiceA: string;
      choiceB: string;
      choiceC: string | null;
      choiceD: string | null;
      correct: Letter;
      comment: string | null;
    }[] = [];

    for (let i = startIdx; i < rows.length; i++) {
      const rowNum = i + 1; // 1-based for messages
      const r = rows[i] || [];

      // Columns: A=0, B=1, C=2, D=3, E=4, F=5
      const q = (r[0] ?? '').toString().trim(); // Question
      const correctText = (r[1] ?? '').toString().trim(); // Correct text
      const optA = (r[2] ?? '').toString().trim(); // Option A (required)
      const optB = (r[3] ?? '').toString().trim(); // Option B (optional)
      const optC = (r[4] ?? '').toString().trim(); // Option C (optional)
      const comment = (r[5] ?? '').toString().trim(); // Comment (optional)

      if (!q) {
        // ignore totally empty rows
        if (!correctText && !optA && !optB && !optC && !comment) continue;
        problems.push(`Row ${rowNum}: Missing question in column A.`);
        continue;
      }
      if (!correctText) {
        problems.push(`Row ${rowNum}: Missing correct text in column B.`);
        continue;
      }
      if (!optA) {
        problems.push(`Row ${rowNum}: Missing Option A in column C.`);
        continue;
      }

      // Build the candidate options list (C, D, E, optionally F would be a comment)
      // We support up to 4 choices; if you want a 4th option, put it in column E and
      // leave comment in F. If you prefer 3-choice questions, leave D/E empty.
      const options = [optA, optB, optC].filter(Boolean);

      // We allow up to 4 options. If you want exactly 4, add another column and extend here.
      if (options.length > 4) options.length = 4;

      // Match the "correctText" to one of the options
      const correctIdx = options.findIndex(
        (o) => o.trim().toLowerCase() === correctText.trim().toLowerCase()
      );

      if (correctIdx < 0) {
        problems.push(
          `Row ${rowNum}: Correct text in column B does not match any option (C–E).`
        );
        continue;
      }

      // Normalize to ChoiceA/B/C/D fields
      const [cA, cB, cC, cD] = [
        options[0] ?? '',
        options[1] ?? '',
        options[2] ?? '',
        options[3] ?? '',
      ];

      // Safety: at least A and B slots exist, C/D can be null if unused.
      toCreate.push({
        subjectId,
        text: q,
        choiceA: cA,
        choiceB: cB,
        choiceC: cC || null,
        choiceD: cD || null,
        correct: idxToLetter(correctIdx), // 'A' | 'B' | 'C' | 'D'
        comment: comment || null,
      });
    }

    if (toCreate.length === 0) {
      return NextResponse.json({
        ok: true,
        created: 0,
        problems:
          problems.length > 0
            ? problems
            : ['No valid rows found. Check column mapping.'],
      });
    }

    // Insert in chunks so we don’t exceed Postgres/Prisma limits
    const CHUNK = 500;
    for (let i = 0; i < toCreate.length; i += CHUNK) {
      const slice = toCreate.slice(i, i + CHUNK);
      await prisma.question.createMany({ data: slice });
    }

    return NextResponse.json({
      ok: true,
      created: toCreate.length,
      problems,
    });
  } catch (err: any) {
    // Return a readable error to the client so the UI can show it
    const message =
      err?.message ||
      (typeof err === 'string' ? err : 'Unknown error while importing.');
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}