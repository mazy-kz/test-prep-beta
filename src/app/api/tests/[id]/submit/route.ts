import { NextResponse } from 'next/server';

// Disabled: legacy endpoint from earlier design that used TestSession/TestResponse tables.
export async function POST(
  _req: Request,
  _ctx: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'submit API is disabled in this deployment.' },
    { status: 410 }
  );
}