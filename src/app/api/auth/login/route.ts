import { NextResponse } from 'next/server';
import { createSession } from '@/lib/auth';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function POST(req: Request) {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: 'Server auth configuration is incomplete.' },
      { status: 500 }
    );
  }

  const body = await req.json();
  const email = (body?.email || '').toString().trim();
  const password = (body?.password || '').toString();

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = createSession(email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return res;
}
