'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Button, buttonClasses } from '@/components/ui/button';

type ChoiceKey = 'A' | 'B' | 'C' | 'D';

const letterByIndex = (i: number) => (['A', 'B', 'C', 'D'] as const)[i]!;

type StoredQuestion = {
  id: string;
  text: string;
  options: Array<{ key: ChoiceKey; text: string; correct: boolean }>;
  pickedIndex?: number;
  comment?: string | null;
};

type ResultPayload = {
  score: number;
  total: number;
  reveal: 'immediate' | 'end';
  items: StoredQuestion[];
  subjectName?: string | null;
  completedAt?: string;
  settings?: {
    mode?: 'twenty' | 'thirty' | 'forty' | 'all';
    plannedCount?: number;
  };
};

function celebratoryMessage(accuracy: number) {
  if (accuracy >= 90) return 'Outstanding work! Keep challenging yourself.';
  if (accuracy >= 75) return 'Great job! A little more practice will get you to mastery.';
  if (accuracy >= 50) return 'Solid effort—review the tricky questions and try again.';
  return 'Keep going! Revisit the material and retake when you are ready.';
}

const statusStyles = {
  correct: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  incorrect: 'bg-rose-100 text-rose-900 border-rose-200',
  skipped: 'bg-amber-100 text-amber-900 border-amber-200',
};

export default function ResultPage() {
  const router = useRouter();
  const [data, setData] = useState<ResultPayload | null>(null);
  const [error, setError] = useState('');
  const [showOnlyIncorrect, setShowOnlyIncorrect] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('tp_results');
      if (!raw) {
        router.replace('/student');
        return;
      }
      const parsed = JSON.parse(raw) as ResultPayload;
      if (!parsed || !Array.isArray(parsed.items)) {
        setError('Results data is incomplete.');
        return;
      }
      setData(parsed);
    } catch {
      router.replace('/student');
    }
  }, [router]);

  const summary = useMemo(() => {
    if (!data) return { correct: 0, incorrect: 0, skipped: 0 };
    return data.items.reduce(
      (acc, q) => {
        if (q.pickedIndex === undefined) {
          acc.skipped += 1;
        } else if (q.options[q.pickedIndex].correct) {
          acc.correct += 1;
        } else {
          acc.incorrect += 1;
        }
        return acc;
      },
      { correct: 0, incorrect: 0, skipped: 0 },
    );
  }, [data]);

  const filteredItems = useMemo(() => {
    if (!data) return [] as StoredQuestion[];
    if (!showOnlyIncorrect) return data.items;
    return data.items.filter(
      (q) => q.pickedIndex === undefined || !q.options[q.pickedIndex].correct,
    );
  }, [data, showOnlyIncorrect]);

  if (!data) {
    if (error) {
      return (
        <main className="max-w-3xl mx-auto p-6 space-y-4">
          <Alert variant="error" title="Unable to display results">
            {error}
          </Alert>
          <a href="/student" className={buttonClasses({ variant: 'primary', size: 'sm' })}>
            Back to practice setup
          </a>
        </main>
      );
    }
    return null;
  }

  const accuracy = Math.round((data.score / Math.max(1, data.total)) * 100);
  const completedDate = data.completedAt ? new Date(data.completedAt) : null;
  const revealMode = data.reveal === 'immediate' ? 'After each question' : 'Only at the end';
  const modeCopy = {
    twenty: '20-question drill',
    thirty: '30-question set',
    forty: '40-question set',
    all: 'Full question bank',
  } as const;

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Results</h1>
          {data.subjectName ? (
            <p className="text-sm text-slate-600">{data.subjectName}</p>
          ) : null}
        </div>
        <a className={buttonClasses({ variant: 'secondary', size: 'sm' })} href="/">
          Home
        </a>
      </div>

      {error && <Alert variant="error" title="Unable to display results">{error}</Alert>}

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-600">Score</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {data.score}/{data.total}
          </div>
          <div className="mt-1 text-sm text-slate-500">{accuracy}% accuracy</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-600">Mode</div>
          <div className="mt-2 text-lg font-medium text-slate-900">
            {modeCopy[data.settings?.mode ?? 'all']}
          </div>
          <div className="mt-1 text-sm text-slate-500">{revealMode}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm text-slate-600">Completed</div>
          <div className="mt-2 text-lg font-medium text-slate-900">
            {completedDate ? completedDate.toLocaleString() : 'Just now'}
          </div>
          <div className="mt-1 text-sm text-slate-500">{celebratoryMessage(accuracy)}</div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
          <span className={`rounded-full border px-3 py-1 ${statusStyles.correct}`}>
            Correct: {summary.correct}
          </span>
          <span className={`rounded-full border px-3 py-1 ${statusStyles.incorrect}`}>
            Incorrect: {summary.incorrect}
          </span>
          <span className={`rounded-full border px-3 py-1 ${statusStyles.skipped}`}>
            Skipped: {summary.skipped}
          </span>
        </div>
        <Button
          variant={showOnlyIncorrect ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setShowOnlyIncorrect((v) => !v)}
        >
          {showOnlyIncorrect ? 'Show all questions' : 'Review incorrect & skipped'}
        </Button>
      </div>

      <section className="space-y-4">
        {filteredItems.length === 0 ? (
          <Alert variant="success" title="Nothing to review">
            You answered every question correctly. Try a harder set or another subject!
          </Alert>
        ) : (
          filteredItems.map((q, qi) => {
            const pickedIdx = q.pickedIndex;
            const correctIdx = q.options.findIndex((o) => o.correct);
            const correct = pickedIdx !== undefined && q.options[pickedIdx].correct;
            const status = pickedIdx === undefined ? 'skipped' : correct ? 'correct' : 'incorrect';

            return (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="text-sm font-medium text-slate-600">
                    Question {qi + 1}/{data.total}
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
                    {status === 'correct' && 'Correct'}
                    {status === 'incorrect' && 'Incorrect'}
                    {status === 'skipped' && 'Skipped'}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-3 text-slate-800 whitespace-pre-wrap">
                  {q.text}
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  {q.options.map((opt, i) => {
                    const isCorrect = opt.correct;
                    const isPicked = pickedIdx === i;
                    const isWrongPicked = isPicked && !isCorrect;

                    return (
                      <div
                        key={i}
                        className={`rounded-xl border px-3 py-2 text-sm ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : isWrongPicked
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : 'bg-white'
                        }`}
                      >
                        <span className="font-semibold mr-2">{letterByIndex(i)}.</span>
                        {opt.text}
                      </div>
                    );
                  })}
                </div>

                <div className="text-sm text-slate-600">
                  Your answer:{' '}
                  <b>{pickedIdx !== undefined ? letterByIndex(pickedIdx) : '—'}</b>
                  {' · '}Correct answer: <b>{letterByIndex(correctIdx)}</b>
                </div>

                {q.comment ? (
                  <Alert variant="info" title="Explanation">
                    {q.comment}
                  </Alert>
                ) : null}
              </div>
            );
          })
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <a href="/student" className={buttonClasses({ variant: 'primary' })}>
          Start another practice
        </a>
        <Button variant="outline" onClick={() => router.push('/')}>Go to home</Button>
      </div>
    </main>
  );
}
