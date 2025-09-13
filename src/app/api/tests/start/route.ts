import { NextResponse } from 'next/server';

// Disabled: legacy endpoint from an older server-side testing flow.
// Current app builds the test on the client and doesn't need this route.
export async function POST(_req: Request) {
  return NextResponse.json(
    { error: 'start API is disabled in this deployment.' },
    { status: 410 }
  );
}