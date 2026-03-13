import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value;
  const email = verifySession(token);
  return NextResponse.json({ email });
}
