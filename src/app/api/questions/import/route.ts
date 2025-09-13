import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export const runtime = 'nodejs';        // hard force Node runtime for Vercel
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Letter = 'A' | 'B' | 'C' | 'D';
const letters: Letter[] = ['A', 'B', 'C', 'D'];
const idxToLetter = (i: number) => letters[i];

export async function POST(req: Request) {
  try {
    //⚠️ dynamic import avoids edge/esm bundling issues on Vercel
    const XLSX = (await import('xlsx')).default || (await import('xlsx'));

    const fd = await req.formData();
    const file = fd.get('file') as File | null;
    const subjectId = (fd.get('subjectId') as string | null)?.trim() || '';

    if (!subjectId) {
      return NextResponse.json({ ok: false, message: 'Missing subjectId.' }, { status: 400 });
    }
    if (!file) {
      return NextResponse.json({ ok: false, message: 'Missing file.' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ ok: false, message: 'File too large (>5MB).' }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());

    // Parse workbook
    const wb = XLSX.read(buf, { type: 'buffer' });
    const sheetName = wb.SheetNames?.[0];
    if (!sheetName) {
      return NextResponse.json({ ok: false, message: 'No sheet found.' }, { status: 400 });
    }

    const ws = wb.Sheets[sheetName];
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

    if (!rows?.length) {
      return NextResponse.json({ ok: false, message: 'Sheet is empty.' }, { status: 400 });
    }

    // detect header
    const looksHeader = String(rows[0]?.[0] ?? '').toLowerCase().includes('question');
    const start = looksHeader ? 1 : 0;

    const problems: string[] = [];
    const batch: {
      subjectId: string;
      text: string;
      choiceA: string;
      choiceB: string;
      choiceC: string | null;
      choiceD: string | null;
      correct: Letter;
      comment: string | null;
    }[] = [];

    for (let i = start; i < rows.length; i++) {
      const r = rows[i] || [];
      const rowNum = i + 1;

      const q = (r[0] ?? '').toString().trim();             // A = question (required)
      const correctText = (r[1] ?? '').toString().trim();   // B = correct text (required)
      const optA = (r[2] ?? '').toString().trim();          // C = Option A (required)
      const optB = (r[3] ?? '').toString().trim();          // D = Option B (optional)
      const optC = (r[4] ?? '').toString().trim();          // E = Option C (optional)
      const comment = (r[5] ?? '').toString().trim();       // F = comment (optional)

      // entirely blank row → skip
      if (!q && !correctText && !optA && !optB && !optC && !comment) continue;

      if (!q) { problems.push(`Row ${rowNum}: missing Question (A).`); continue; }
      if (!correctText) { problems.push(`Row ${rowNum}: missing Correct text (B).`); continue; }
      if (!optA) { problems.push(`Row ${rowNum}: missing Option A (C).`); continue; }

      const options = [optA, optB, optC].filter(Boolean);
      const correctIdx = options.findIndex(
        (o) => o.trim().toLowerCase() === correctText.toLowerCase()
      );
      if (correctIdx < 0) {
        problems.push(`Row ${rowNum}: correct text (B) not found among options C–E.`);
        continue;
      }

      const [cA, cB, cC, cD] = [options[0] ?? '', options[1] ?? '', options[2] ?? '', options[3] ?? ''];

      batch.push({
        subjectId,
        text: q,
        choiceA: cA,
        choiceB: cB,
        choiceC: cC || null,
        choiceD: cD || null,
        correct: idxToLetter(correctIdx),
        comment: comment || null,
      });
    }

    if (!batch.length) {
      return NextResponse.json({
        ok: true, created: 0, problems: problems.length ? problems : ['No valid rows found.'],
      });
    }

    // write in chunks
    const CHUNK = 500;
    for (let i = 0; i < batch.length; i += CHUNK) {
      const slice = batch.slice(i, i + CHUNK);
      await prisma.question.createMany({ data: slice });
    }

    return NextResponse.json({ ok: true, created: batch.length, problems });
  } catch (err: any) {
    // return full error so you can see the reason in DevTools → Network → Response
    const message = err?.message || String(err);
    const stack = err?.stack || null;
    console.error('IMPORT_ROUTE_ERROR:', message, stack);
    return NextResponse.json({ ok: false, message, stack }, { status: 500 });
  }
}