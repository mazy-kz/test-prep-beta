import { NextResponse } from 'next/server';

// This endpoint is intentionally disabled because the project no longer uses
// TestSession/TestResponse tables. Summary is computed client-side.
export async function GET(
  _req: Request,
  _ctx: { params: { id: string } }
) {
  return NextResponse.json(
    { error: 'results API is disabled in this deployment.' },
    { status: 410 }
  );
}