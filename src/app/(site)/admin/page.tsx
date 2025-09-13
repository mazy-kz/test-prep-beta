'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Subject = { id: string; name: string };
type Choice = 'A' | 'B' | 'C' | 'D';
type Question = {
  id: string;
  subjectId: string;
  text: string;
  choiceA: string | null;
  choiceB: string | null;
  choiceC: string | null;
  choiceD: string | null;
  correct: Choice;
  comment: string | null;
};

export default function AdminPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selected, setSelected] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  // questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qLoading, setQLoading] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);

  // manual add
  const [text, setText] = useState('');
  const [A, setA] = useState('');
  const [B, setB] = useState('');
  const [C, setC] = useState('');
  const [D, setD] = useState('');
  const [correct, setCorrect] = useState<Choice>('A');
  const [comment, setComment] = useState('');

  // auto-dismiss banners
  useEffect(() => {
    if (!status && !error) return;
    const t = setTimeout(() => { setStatus(''); setError(''); }, 2500);
    return () => clearTimeout(t);
  }, [status, error]);

  async function loadSubjects() {
    const r = await fetch('/api/subjects', { cache: 'no-store' });
    const data = await r.json();
    setSubjects(data);
    if (!selected && data.length) setSelected(data[0].id);
  }
  useEffect(() => { loadSubjects(); }, []);

  async function loadQuestions(sid: string) {
    if (!sid) { setQuestions([]); return; }
    setQLoading(true);
    try {
      const r = await fetch(`/api/questions?subjectId=${encodeURIComponent(sid)}`, { cache: 'no-store' });
      const data = await r.json();
      if (r.ok) setQuestions(data);
      else setError(data?.error || 'Failed to load questions');
    } finally {
      setQLoading(false);
    }
  }
  useEffect(() => { loadQuestions(selected); }, [selected]);

  async function handleCreateSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!newSubject.trim()) return;
    setError(''); setStatus('');
    const r = await fetch('/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newSubject.trim() }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { setError(data?.error || 'Create failed'); return; }
    setNewSubject('');
    setStatus('Subject added.');
    await loadSubjects();
  }

  async function renameSubject(id: string) {
    const s = subjects.find((x) => x.id === id);
    if (!s) return;
    const nn = prompt('Rename subject', s.name);
    if (!nn || nn === s.name) return;
    const r = await fetch(`/api/subjects/${id}?name=${encodeURIComponent(nn)}`, { method: 'PATCH' });
    if (r.ok) setStatus('Subject renamed.');
    else setError('Update failed');
    loadSubjects();
  }

  async function delSubject(id: string) {
    if (!confirm('Delete subject?')) return;
    const r = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
    if (!r.ok) setError('Delete failed'); else setStatus('Subject deleted.');
    if (selected === id) setSelected('');
    loadSubjects();
    setQuestions([]);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  async function importExcel() {
    setError(''); setStatus('');
    if (!file) return setError('Choose a file first');
    if (!selected) return setError('Select a subject');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('subjectId', selected);

    setStatus('Uploading…');
    const res = await fetch('/api/questions/import', { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatus(`Imported ${data.created?.length ?? 0} questions.`);
      loadQuestions(selected);
    } else setError(data?.error || 'Upload failed');
  }

  async function addManual() {
    setError(''); setStatus('');
    if (!selected) return setError('Select a subject');
    if (!text.trim() || !A.trim() || !B.trim() || !C.trim())
      return setError('Question, A, B, C are required');

    const r = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subjectId: selected,
        text,
        choiceA: A,
        choiceB: B,
        choiceC: C,
        choiceD: D || null,
        correct,
        comment: comment || null,
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setError(d?.error || 'Add failed'); return; }
    setText(''); setA(''); setB(''); setC(''); setD(''); setComment(''); setCorrect('A');
    setStatus('Question added.');
    loadQuestions(selected);
  }

  function beginEdit(q: Question) { setEditing(q); }
  async function saveEdit() {
    if (!editing) return;
    const r = await fetch(`/api/questions/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setError(d?.error || 'Update failed'); return; }
    setStatus('Question updated.');
    setEditing(null);
    loadQuestions(selected);
  }
  async function deleteQuestion(id: string) {
    if (!confirm('Delete this question?')) return;
    const r = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setError(d?.error || 'Delete failed'); return; }
    setStatus('Question deleted.');
    loadQuestions(selected);
  }

  const selectedName = useMemo(() => subjects.find(s => s.id === selected)?.name ?? '', [subjects, selected]);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <div className="flex gap-2">
          <a className="px-3 py-2 rounded-xl bg-gray-100" href="/">Home</a>
          <button className="px-3 py-2 rounded-xl bg-red-600 text-white" onClick={logout}>Logout</button>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">{error}</div>}
      {status && <div className="p-3 rounded-xl bg-green-50 border border-green-200 text-green-700">{status}</div>}

      <section className="space-y-3">
        <h2 className="font-medium">Subjects</h2>
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <div key={s.id} className="border rounded-xl px-3 py-2 flex items-center gap-2">
              <button
                className={`px-2 py-1 rounded ${selected === s.id ? 'bg-blue-50' : 'bg-white'}`}
                onClick={() => setSelected(s.id)}
                title="Select to manage questions"
              >
                {s.name}
              </button>
              <button className="text-blue-600" onClick={() => renameSubject(s.id)}>Rename</button>
              <button className="text-red-600" onClick={() => delSubject(s.id)}>Delete</button>
            </div>
          ))}
          {!subjects.length && <div className="text-sm text-gray-500">No subjects yet. Add one below.</div>}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <form onSubmit={handleCreateSubject} className="flex gap-2 items-center">
            <input
              className="border rounded-md px-2 py-2"
              placeholder="New subject"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <button type="submit" className="px-3 py-2 rounded-xl bg-blue-600 text-white">Add</button>
          </form>

          <select className="border rounded-md px-2 py-2" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="" disabled>Select subject…</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Excel Import (only)</h2>
        <div className="flex gap-2 items-center">
          <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <button className="px-3 py-2 rounded-xl bg-blue-600 text-white" onClick={importExcel}>Upload</button>
        </div>
        <p className="text-sm text-gray-600">
          Excel mapping: A=Question, B=Correct text (stored as letter B), C=Option A, D=Option C (optional), E=Option D (optional), F=Comment.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-medium">Add Question Manually</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <textarea className="border rounded-md px-2 py-2" placeholder="Question text" value={text} onChange={(e) => setText(e.target.value)} />
          <select className="border rounded-md px-2 py-2" value={correct} onChange={(e) => setCorrect(e.target.value as Choice)}>
            <option value="A">A (default)</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
          </select>
          <input className="border rounded-md px-2 py-2" placeholder="Choice A" value={A} onChange={(e) => setA(e.target.value)} />
          <input className="border rounded-md px-2 py-2" placeholder="Choice B" value={B} onChange={(e) => setB(e.target.value)} />
          <input className="border rounded-md px-2 py-2" placeholder="Choice C" value={C} onChange={(e) => setC(e.target.value)} />
          <input className="border rounded-md px-2 py-2" placeholder="Choice D (optional)" value={D} onChange={(e) => setD(e.target.value)} />
          <input className="border rounded-md px-2 py-2 md:col-span-2" placeholder="Comment (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <div><button className="px-3 py-2 rounded-xl bg-blue-600 text-white" onClick={addManual} disabled={!selected}>Add Question</button></div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Questions {selectedName ? `— ${selectedName}` : ''}</h2>
          <button className="text-sm text-blue-700" onClick={() => loadQuestions(selected)} disabled={!selected || qLoading}>
            {qLoading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {!selected ? (
          <div className="text-sm text-gray-500">Select a subject to see its questions.</div>
        ) : qLoading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : questions.length === 0 ? (
          <div className="text-sm text-gray-500">No questions yet for this subject.</div>
        ) : (
          <div className="space-y-2">
            {questions.map(q => (
              <div key={q.id} className="border rounded-xl p-3 space-y-2">
                {editing?.id === q.id ? (
                  <>
                    <textarea className="border rounded-md px-2 py-2 w-full" value={editing.text} onChange={e => setEditing({ ...editing!, text: e.target.value })} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input className="border rounded-md px-2 py-2" placeholder="Choice A" value={editing.choiceA ?? ''} onChange={e => setEditing({ ...editing!, choiceA: e.target.value })} />
                      <input className="border rounded-md px-2 py-2" placeholder="Choice B" value={editing.choiceB ?? ''} onChange={e => setEditing({ ...editing!, choiceB: e.target.value })} />
                      <input className="border rounded-md px-2 py-2" placeholder="Choice C" value={editing.choiceC ?? ''} onChange={e => setEditing({ ...editing!, choiceC: e.target.value })} />
                      <input className="border rounded-md px-2 py-2" placeholder="Choice D" value={editing.choiceD ?? ''} onChange={e => setEditing({ ...editing!, choiceD: e.target.value })} />
                      <select className="border rounded-md px-2 py-2" value={editing.correct} onChange={e => setEditing({ ...editing!, correct: e.target.value as Choice })}>
                        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                      </select>
                      <input className="border rounded-md px-2 py-2" placeholder="Comment" value={editing.comment ?? ''} onChange={e => setEditing({ ...editing!, comment: e.target.value })} />
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-2 rounded-xl bg-blue-600 text-white" onClick={saveEdit}>Save</button>
                      <button className="px-3 py-2 rounded-xl bg-gray-100" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-medium break-words">{q.text}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div><b>A.</b> {q.choiceA}</div>
                      <div><b>B.</b> {q.choiceB}</div>
                      {q.choiceC && <div><b>C.</b> {q.choiceC}</div>}
                      {q.choiceD && <div><b>D.</b> {q.choiceD}</div>}
                    </div>
                    <div className="text-sm text-gray-600">Correct: <b>{q.correct}</b>{q.comment ? ` — ${q.comment}` : ''}</div>
                    <div className="flex gap-2">
                      <button className="px-3 py-2 rounded-xl bg-gray-100" onClick={() => beginEdit(q)}>Edit</button>
                      <button className="px-3 py-2 rounded-xl bg-red-600 text-white" onClick={() => deleteQuestion(q.id)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
