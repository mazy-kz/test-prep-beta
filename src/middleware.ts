// src/middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  // Protect only the Admin UI page
  if (req.nextUrl.pathname.startsWith('/admin')) {
    const adminFlag = req.cookies.get('admin')?.value; // expects "1"
    if (adminFlag !== '1') {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin'],
};