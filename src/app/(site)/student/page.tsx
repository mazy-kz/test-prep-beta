'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/alert';
import { Button, buttonClasses } from '@/components/ui/button';
import { SegmentedControl, type SegmentedControlOption } from '@/components/ui/segmented-control';

type Subject = { id: string; name: string; questionCount: number };
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

const sizeMap = { twenty: 20, thirty: 30, forty: 40 } as const;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
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
  const [activeSubjectName, setActiveSubjectName] = useState('');

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
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    fetch('/api/subjects', { cache: 'no-store' })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok || !Array.isArray(data)) {
          setErr((data as any)?.error || 'Failed to load subjects');
          return;
        }
        setSubjects(data);
        if (data.length) setSubjectId(data[0].id);
      })
      .catch(() => setErr('Failed to load subjects'));
  }, []);

  const current = useMemo(() => deck[idx] ?? null, [deck, idx]);
  const selectedSubject = useMemo(
    () => subjects.find((s) => s.id === subjectId) ?? null,
    [subjects, subjectId],
  );
  const availableCount = selectedSubject?.questionCount ?? 0;
  const plannedCount = useMemo(() => {
    if (!selectedSubject) return 0;
    if (mode === 'all') return availableCount;
    return Math.min(sizeMap[mode], availableCount || sizeMap[mode]);
  }, [selectedSubject, availableCount, mode]);
  const isCountCapped =
    selectedSubject && mode !== 'all' && availableCount > 0 && availableCount < sizeMap[mode];
  const estimatedMinutes = plannedCount ? Math.max(5, Math.round(plannedCount * 0.75)) : 0;

  async function start() {
    if (!subjectId) {
      setErr('Please choose a subject');
      return;
    }
    setErr('');
    setLoading(true);
    setDeck([]);
    setIdx(0);
    setShowCancelConfirm(false);

    try {
      const r = await fetch(`/api/questions?subjectId=${encodeURIComponent(subjectId)}`, {
        cache: 'no-store',
      });
      const list = await r.json().catch(() => null);
      if (!r.ok || !Array.isArray(list)) {
        setErr((list as any)?.error || 'Could not start test');
        setLoading(false);
        return;
      }
      if (list.length === 0) {
        setErr('This subject has no questions yet.');
        setLoading(false);
        return;
      }

      const count = mode === 'all' ? list.length : Math.min(sizeMap[mode], list.length);

      const selected = shuffle(list).slice(0, count);
      const prepared = selected.map((q: Question) => {
        const opts: Array<{ key: ChoiceKey; text: string; correct: boolean }> = [];
        if (q.choiceA) opts.push({ key: 'A', text: q.choiceA, correct: q.correct === 'A' });
        if (q.choiceB) opts.push({ key: 'B', text: q.choiceB, correct: q.correct === 'B' });
        if (q.choiceC) opts.push({ key: 'C', text: q.choiceC, correct: q.correct === 'C' });
        if (q.choiceD) opts.push({ key: 'D', text: q.choiceD, correct: q.correct === 'D' });
        return { id: q.id, text: q.text, options: shuffle(opts), comment: q.comment ?? null };
      });

      setDeck(shuffle(prepared));
      setIdx(0);
      const activeSubject = subjects.find((s) => s.id === subjectId);
      setActiveSubjectName(activeSubject?.name ?? '');
    } catch (e) {
      console.error(e);
      setErr('Network error starting test');
    } finally {
      setLoading(false);
    }
  }

  function pick(optionIndex: number) {
    if (!current) return;
    if (reveal === 'immediate' && current.pickedIndex !== undefined) return; // lock after pick
    const copy = [...deck];
    copy[idx] = { ...current, pickedIndex: optionIndex };
    setDeck(copy);
  }

  function next() {
    if (idx < deck.length - 1) {
      setIdx(idx + 1);
      return;
    }

    const total = deck.length;
    const score = deck.reduce(
      (acc, q) =>
        acc + (q.pickedIndex !== undefined && q.options[q.pickedIndex].correct ? 1 : 0),
      0,
    );

    const payload = {
      score,
      total,
      reveal,
      items: deck,
      subjectName: activeSubjectName || selectedSubject?.name || null,
      completedAt: new Date().toISOString(),
      settings: {
        mode,
        plannedCount: total,
      },
    };

    sessionStorage.setItem('tp_results', JSON.stringify(payload));
    router.push('/student/result');
  }

  function reset() {
    setDeck([]);
    setIdx(0);
    setShowCancelConfirm(false);
    setActiveSubjectName('');
  }

  const subjectOptions = subjects.map((s) => (
    <option key={s.id} value={s.id}>
      {s.name}
    </option>
  ));

  const quantityOptions = useMemo<
    Array<SegmentedControlOption<'twenty' | 'thirty' | 'forty' | 'all'>>
  >(
    () => [
      { label: '20 Qs', value: 'twenty', description: 'Quick drill' },
      { label: '30 Qs', value: 'thirty', description: 'Balanced set' },
      { label: '40 Qs', value: 'forty', description: 'Deep review' },
      {
        label: 'All Qs',
        value: 'all',
        description: selectedSubject
          ? `${selectedSubject.questionCount} available`
          : 'Every question',
      },
    ],
    [selectedSubject],
  );

  const revealOptions = useMemo<Array<SegmentedControlOption<Reveal>>>(
    () => [
      { label: 'After each', value: 'immediate', description: 'Learn as you go' },
      { label: 'At the end', value: 'end', description: 'Simulate exam mode' },
    ],
    [],
  );

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Student Practice</h1>
          <p className="text-sm text-slate-600">
            Choose a subject, customize your session, and get instant feedback.
          </p>
        </div>
        <a className={buttonClasses({ variant: 'secondary', size: 'sm' })} href="/">
          Home
        </a>
      </div>

      {err && <Alert variant="error" title="Something went wrong">{err}</Alert>}

      {deck.length === 0 && (
        <section className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="subject-select">
              Subject
            </label>
            <select
              id="subject-select"
              className="w-full max-w-xl rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
            >
              {subjectOptions}
            </select>
            <p className="text-xs text-slate-600">
              {selectedSubject
                ? `${selectedSubject.questionCount} question${
                    selectedSubject.questionCount === 1 ? '' : 's'
                  } available for ${selectedSubject.name}.`
                : 'Add subjects from the admin dashboard to begin.'}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-slate-700">Question quantity</div>
              {plannedCount ? (
                <div className="text-xs text-slate-600">
                  Pulling {plannedCount} question{plannedCount === 1 ? '' : 's'}
                  {estimatedMinutes
                    ? ` • about ${estimatedMinutes} min`
                    : ''}
                  {isCountCapped
                    ? ` (limited by ${availableCount} available)`
                    : ''}
                </div>
              ) : null}
            </div>
            <SegmentedControl
              options={quantityOptions}
              value={mode}
              onChange={(value) => setMode(value)}
              ariaLabel="Choose how many questions to practice"
            />
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700">Answer reveal</div>
            <SegmentedControl
              options={revealOptions}
              value={reveal}
              onChange={(value) => setReveal(value)}
              ariaLabel="Choose when answers are revealed"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={start}
              disabled={!subjectId || loading}
            >
              {loading ? 'Starting…' : 'Start Test'}
            </Button>
            {!availableCount && !loading ? (
              <span className="text-xs text-rose-600">
                This subject needs questions before you can start.
              </span>
            ) : null}
          </div>
        </section>
      )}

      {deck.length > 0 && current && (
        <section className="space-y-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{activeSubjectName || 'Practice session'}</h2>
              <p className="text-sm text-slate-600">
                Question {idx + 1} of {deck.length} · Reveal {reveal === 'immediate' ? 'after each question' : 'at the end'}
              </p>
            </div>
            <div className="text-sm text-slate-600">
              {deck.filter((q) => q.pickedIndex !== undefined).length} answered
            </div>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200" aria-hidden>
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${Math.min(100, ((idx + 1) / deck.length) * 100)}%` }}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-base font-medium text-slate-800 whitespace-pre-wrap">
              {current.text}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
                  className={buttonClasses({
                    variant: picked ? 'primary' : 'outline',
                    className: `justify-start whitespace-pre-wrap text-left ${
                      showCorrect
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : showWrongPicked
                        ? 'bg-rose-50 border-rose-300 text-rose-900'
                        : ''
                    }`,
                  })}
                  disabled={reveal === 'immediate' && current.pickedIndex !== undefined}
                >
                  <span className="font-semibold mr-2">{label}.</span>
                  <span className="text-sm leading-5">{opt.text}</span>
                </button>
              );
            })}
          </div>

          {reveal === 'immediate' && current.pickedIndex !== undefined && (
            <Alert
              variant={current.options[current.pickedIndex!].correct ? 'success' : 'error'}
              title={current.options[current.pickedIndex!].correct ? 'Correct' : 'Incorrect'}
            >
              <div className="space-y-1">
                <p>
                  Correct answer: <b>{letterByIndex(current.options.findIndex((o) => o.correct))}</b>
                </p>
                {current.comment ? <p className="text-slate-700">{current.comment}</p> : null}
              </div>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={next}>{idx === deck.length - 1 ? 'Finish test' : 'Next question'}</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCancelConfirm(true)}
            >
              Cancel session
            </Button>
          </div>

          {showCancelConfirm && (
            <Alert
              variant="info"
              title="Leave this session?"
              className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
              <p className="text-sm text-slate-700">
                You will lose your current progress. This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowCancelConfirm(false)}>
                  Continue practicing
                </Button>
                <Button variant="outline" onClick={reset}>
                  Discard progress
                </Button>
              </div>
            </Alert>
          )}
        </section>
      )}
    </main>
  );
}
