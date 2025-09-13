import { NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import * as XLSX from 'xlsx';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const trim = (v: unknown) => (v == null ? '' : String(v).trim());

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;
    const subjectId = trim(form.get('subjectId'));

    if (!subjectId) return NextResponse.json({ error: 'subjectId is required' }, { status: 400 });
    const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
    if (!subject) return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    if (!file) return NextResponse.json({ error: 'file is required' }, { status: 400 });

    const buf = new Uint8Array(await file.arrayBuffer());
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    if (!ws) return NextResponse.json({ error: 'No worksheet found' }, { status: 400 });

    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, raw: true }) as any[][];
    if (!rows?.length) return NextResponse.json({ created: [], count: 0 });

    const data = rows.filter(r => Array.isArray(r) && r.some(c => trim(c) !== ''));
    // Optional header
    if (data.length) {
      const a0 = trim(data[0][0]).toLowerCase();
      const b0 = trim(data[0][1]).toLowerCase();
      if (a0.includes('question') || b0.includes('correct')) data.shift();
    }

    const problems: string[] = [];
    const writes = [];

    data.forEach((r, i) => {
      const row = i + 2; // close enough even if header removed
      const qText = trim(r[0]);          // A (required)
      const correct = trim(r[1]);        // B (required)
      const optC = trim(r[2]);           // C (required)
      const optD = trim(r[3]);           // D (optional)
      const optE = trim(r[4]);           // E (optional)
      const comment = trim(r[5]) || null;

      if (!qText)   { problems.push(`Row ${row}: Column A (question) is required.`); return; }
      if (!correct) { problems.push(`Row ${row}: Column B (correct answer) is required.`); return; }
      if (!optC)    { problems.push(`Row ${row}: Column C (other option) is required.`); return; }

      // Guarantee non-null choiceB & choiceC
      const choiceA = correct;                 // correct
      const choiceB = optC;                    // required "other option"
      let   choiceC = '';                      // must be non-null
      let   choiceD: string | null = null;

      if (optD && optE) {                      // both present
        choiceC = optD;
        choiceD = optE;
      } else if (optD && !optE) {              // only D present
        choiceC = optD;
        choiceD = null;
      } else if (!optD && optE) {              // only E present → promote E into C
        choiceC = optE;
        choiceD = null;
      } else {                                 // neither D nor E present → synthesize
        choiceC = 'None of these';
        choiceD = null;
      }

      writes.push(
        prisma.question.create({
          data: {
            text: qText,
            choiceA,
            choiceB,
            choiceC,           // ✅ always provided
            choiceD,
            correct: 'A',
            comment,
            subject: { connect: { id: subjectId } },
          },
          select: { id: true },
        })
      );
    });

    if (problems.length) {
      // return the first problem (UI shows a single banner), include full list for debugging if needed
      return NextResponse.json({ error: problems[0], details: problems }, { status: 400 });
    }
    if (!writes.length) return NextResponse.json({ created: [], count: 0 });

    const created = await prisma.$transaction(writes);
    return NextResponse.json({ created: created.map(c => c.id), count: created.length });
  } catch (e: any) {
    console.error('[POST /api/questions/import]', e);
    return NextResponse.json({ error: e?.message || 'Import failed' }, { status: 500 });
  }
}