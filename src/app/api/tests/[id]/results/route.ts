import { NextResponse } from 'next/server'; import { prisma } from '@/server/db';
type Letter='A'|'B'|'C'|'D';
export async function GET(_: Request,{params}:{params:{id:string}}){
  const s=await prisma.testSession.findUnique({where:{id:params.id},include:{responses:{include:{question:true}}}});
  if(!s) return NextResponse.json({error:'not found'},{status:404});
  const items = s.responses.map(r=>{
    const order = r.order as string;
    const src: Record<Letter,string|null|undefined> = {
      A: r.question.choiceA || null,
      B: r.question.choiceB || null,
      C: r.question.choiceC || null,
      D: r.question.choiceD || null,
    };
    const map: Record<Letter,Letter> = {A: order[0] as Letter, B: order[1] as Letter, C: order[2] as Letter, D: order[3] as Letter};
    const choices: Record<Letter,string|null> = {A:null,B:null,C:null,D:null};
    (['A','B','C','D'] as Letter[]).forEach(L=>{ const orig = map[L]; if (orig && src[orig]) choices[L]=src[orig]!; });
    let correct: Letter | null = null;
    (['A','B','C','D'] as Letter[]).forEach(L=>{ const orig = map[L]; if (orig=== (r.question.correct as Letter)) correct=L; });
    return { responseId: r.id, questionId: r.questionId, text: r.question.text, choices, correct, picked: r.picked, comment: r.question.comment ?? undefined };
  });
  const score = items.reduce((acc,it)=> acc + (it.picked && it.correct && it.picked===it.correct ? 1:0), 0);
  return NextResponse.json({ sessionId: s.id, revealMode: s.revealMode, quantity: s.quantity, score, total: items.length, items });
}
