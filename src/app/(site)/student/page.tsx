'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Subject = { id: string; name: string };
type ChoiceKey = 'A' | 'B' | 'C' | 'D';
type Question = {
  id: string;
  subjectId: string;
  text: string;
  choiceA: string | null;
  choiceB: string | null;
  choiceC: string | null;
  choiceD: string | null;
  correct: ChoiceKey;
  comment: string | null;
};
type Reveal = 'immediate' | 'end';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const letterByIndex = (i: number) => (['A', 'B', 'C', 'D'] as const)[i]!;

export default function Student() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState('');

  // 👇 new modes: 20 & 30 added
  const [mode, setMode] = useState<'twenty' | 'thirty' | 'forty' | 'all'>('forty');
  const [reveal, setReveal] = useState<Reveal>('immediate');

  const [deck, setDeck] = useState<
    Array<{
      id: string;
      text: string;
      options: Array<{ key: ChoiceKey; text: string; correct: boolean }>;
      pickedIndex?: number;
      comment?: string | null;
    }>
  >([]);
  const [idx, setIdx] = useState(0);

  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/subjects')
      .then((r) => r.json())
      .then((d: Subject[]) => {
        setSubjects(d);
        if (d.length) setSubjectId(d[0].id);
      })
      .catch(() => setErr('Failed to load subjects'));
  }, []);

  const current = useMemo(() => deck[idx] ?? null, [deck, idx]);

  async function start() {
    if (!subjectId) { setErr('Please choose a subject'); return; }
    setErr(''); setLoading(true); setDeck([]); setIdx(0);

    try {
      const r = await fetch(`/api/questions?subjectId=${encodeURIComponent(subjectId)}`, { cache: 'no-store' });
      const list: Question[] = await r.json();
      if (!r.ok) { setErr((list as any)?.error || 'Could not start test'); setLoading(false); return; }
      if (!Array.isArray(list) || list.length === 0) { setErr('This subject has no questions yet.'); setLoading(false); return; }

      // 👇 pick size by mode
      const sizeMap = { twenty: 20, thirty: 30, forty: 40 } as const;
      const count = mode === 'all' ? list.length : Math.min(sizeMap[mode], list.length);

      const selected = shuffle(list).slice(0, count);
      const prepared = selected.map((q) => {
        const opts: Array<{ key: ChoiceKey; text: string; correct: boolean }> = [];
        if (q.choiceA) opts.push({ key: 'A', text: q.choiceA, correct: q.correct === 'A' });
        if (q.choiceB) opts.push({ key: 'B', text: q.choiceB, correct: q.correct === 'B' });
        if (q.choiceC) opts.push({ key: 'C', text: q.choiceC, correct: q.correct === 'C' });
        if (q.choiceD) opts.push({ key: 'D', text: q.choiceD, correct: q.correct === 'D' });
        return { id: q.id, text: q.text, options: shuffle(opts), comment: q.comment ?? null };
      });

      setDeck(shuffle(prepared));
      setIdx(0);
    } catch {
      setErr('Network error starting test');
    } finally {
      setLoading(false);
    }
  }

  function pick(optionIndex: number) {
    if (!current) return;
    if (reveal === 'immediate' && current.pickedIndex !== undefined) return; // lock after first pick in immediate mode
    const copy = [...deck];
    copy[idx] = { ...current, pickedIndex: optionIndex };
    setDeck(copy);
  }

  function next() {
    if (idx < deck.length - 1) setIdx(idx + 1);
    else {
      const total = deck.length;
      const score = deck.reduce((acc, q) => acc + (q.pickedIndex !== undefined && q.options[q.pickedIndex].correct ? 1 : 0), 0);
      sessionStorage.setItem('tp_results', JSON.stringify({ score, total, reveal, items: deck }));
      router.push('/student/result');
    }
  }

  function reset() { setDeck([]); setIdx(0); }

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Student</h1>
        <a className="px-3 py-2 rounded-xl bg-gray-100" href="/">Home</a>
      </div>

      {err && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">{err}</div>}

      {deck.length === 0 && (
        <section className="space-y-5">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Subject</div>
            <select
              className="border rounded-md px-3 py-2 w-[22rem] max-w-full"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              {subjects.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Question quantity</div>
            <div className="flex flex-wrap gap-2">
              <button className={`px-4 py-2 rounded-xl ${mode === 'twenty' ? 'bg-green-600 text-white' : 'bg-gray-100'}`} onClick={() => setMode('twenty')}>20</button>
              <button className={`px-4 py-2 rounded-xl ${mode === 'thirty' ? 'bg-green-600 text-white' : 'bg-gray-100'}`} onClick={() => setMode('thirty')}>30</button>
              <button className={`px-4 py-2 rounded-xl ${mode === 'forty' ? 'bg-green-600 text-white' : 'bg-gray-100'}`} onClick={() => setMode('forty')}>40</button>
              <button className={`px-4 py-2 rounded-xl ${mode === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100'}`} onClick={() => setMode('all')}>All</button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Answer reveal</div>
            <div className="flex gap-2">
              <button className={`px-4 py-2 rounded-xl ${reveal === 'immediate' ? 'bg-green-600 text-white' : 'bg-gray-100'}`} onClick={() => setReveal('immediate')}>Immediate</button>
              <button className={`px-4 py-2 rounded-xl ${reveal === 'end' ? 'bg-green-600 text-white' : 'bg-gray-100'}`} onClick={() => setReveal('end')}>At End</button>
            </div>
          </div>

          <div>
            <button className="px-5 py-2 rounded-xl bg-blue-600 text-white disabled:opacity-60" onClick={start} disabled={!subjectId || loading}>
              {loading ? 'Starting…' : 'Start Test'}
            </button>
          </div>
        </section>
      )}

      {deck.length > 0 && current && (
        <section className="space-y-4">
          <div className="text-sm text-gray-600">Question {idx + 1} of {deck.length}</div>
          <div className="p-3 rounded-xl bg-gray-50 break-words">{current.text}</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {current.options.map((opt, i) => {
              const label = letterByIndex(i);
              const picked = current.pickedIndex === i;
              const immediate = reveal === 'immediate' && current.pickedIndex !== undefined;
              const showCorrect = immediate && opt.correct;
              const showWrongPicked = immediate && picked && !opt.correct;

              return (
                <button
                  key={i}
                  onClick={() => pick(i)}
                  className={`text-left border rounded-xl p-3 ${picked ? 'border-blue-600' : ''} ${showCorrect ? 'bg-green-50 border-green-300' : ''} ${showWrongPicked ? 'bg-red-50 border-red-300' : ''}`}
                  disabled={reveal === 'immediate' && current.pickedIndex !== undefined}
                >
                  <b className="mr-2">{label}.</b>{opt.text}
                </button>
              );
            })}
          </div>

          {reveal === 'immediate' && current.pickedIndex !== undefined && (
            <div className={`p-3 rounded-xl border text-sm ${current.options[current.pickedIndex!].correct ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <div className="font-medium mb-1">{current.options[current.pickedIndex!].correct ? 'Correct' : 'Incorrect'}</div>
              <div className="mt-1">
                Correct answer:&nbsp;<b>{letterByIndex(current.options.findIndex(o => o.correct))}</b>
              </div>
              {current.comment && <div className="mt-2 text-gray-700">{current.comment}</div>}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button className="px-3 py-2 rounded-xl bg-blue-600 text-white" onClick={next}>
              {idx === deck.length - 1 ? 'Finish' : 'Next'}
            </button>
            <button className="px-3 py-2 rounded-xl bg-gray-100" onClick={reset}>Cancel</button>
          </div>
        </section>
      )}
    </main>
  );
}