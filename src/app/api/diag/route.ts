import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    { error: 'Diagnostic endpoint is disabled in public builds.' },
    { status: 404 }
  );
}
