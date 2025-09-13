'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ChoiceKey = 'A' | 'B' | 'C' | 'D';

const letterByIndex = (i: number) => (['A', 'B', 'C', 'D'] as const)[i]!;

type ResultPayload = {
  score: number;
  total: number;
  reveal: 'immediate' | 'end';
  items: Array<{
    id: string;
    text: string;
    options: Array<{ key: ChoiceKey; text: string; correct: boolean }>;
    pickedIndex?: number;
    comment?: string | null;
  }>;
};

export default function ResultPage() {
  const router = useRouter();
  const [data, setData] = useState<ResultPayload | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('tp_results');
      if (!raw) { router.replace('/student'); return; }
      setData(JSON.parse(raw));
    } catch {
      router.replace('/student');
    }
  }, [router]);

  if (!data) return null;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Results</h1>
        <a className="px-3 py-2 rounded-xl bg-gray-100" href="/">Home</a>
      </div>

      <div className="text-lg">Score: <b>{data.score}/{data.total}</b></div>

      <section className="space-y-4">
        {data.items.map((q, qi) => {
          const pickedIdx = q.pickedIndex;
          const correctIdx = q.options.findIndex(o => o.correct);
          const correct = pickedIdx !== undefined && q.options[pickedIdx].correct;

          return (
            <div key={q.id} className="border rounded-xl p-3 space-y-2">
              <div className="text-sm text-gray-600">Question {qi + 1}/{data.total}</div>
              <div className="p-3 rounded-xl bg-gray-50 break-words">{q.text}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.options.map((opt, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-xl border text-sm ${i === correctIdx ? 'bg-green-50 border-green-300' : i === pickedIdx ? 'bg-red-50 border-red-300' : ''}`}
                  >
                    <b>{letterByIndex(i)}.</b> {opt.text}
                  </div>
                ))}
              </div>
              {q.comment && <div className="text-sm p-3 rounded-xl bg-blue-50 border border-blue-200">{q.comment}</div>}
              <div className="text-sm text-gray-600">
                Your answer: <b>{pickedIdx !== undefined ? letterByIndex(pickedIdx) : '—'}</b>
                {' '}• Correct: <b>{letterByIndex(correctIdx)}</b> — {correct ? '✔' : '✖'}
              </div>
            </div>
          );
        })}
      </section>

      <div>
        <a href="/student" className="px-4 py-2 rounded-xl bg-blue-600 text-white inline-block">Restart Test</a>
      </div>
    </main>
  );
}