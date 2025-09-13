import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from './src/lib/auth';
export function middleware(req: NextRequest){
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith('/admin')) return NextResponse.next();
  const token = req.cookies.get('admin_session')?.value;
  const email = verifySession(token);
  if (!email){ const url = req.nextUrl.clone(); url.pathname='/login'; url.searchParams.set('next', pathname); return NextResponse.redirect(url); }
  return NextResponse.next();
}
export const config = { matcher: ['/admin/:path*'] };
