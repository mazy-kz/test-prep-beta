import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST() {
  return NextResponse.json({ ok: false, message: 'DIAGNOSTIC ROUTE LIVE' }, { status: 500 });
}