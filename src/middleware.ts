import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  // Only protect the Admin UI page route
  if (req.nextUrl.pathname.startsWith('/admin')) {
    // Call your existing auth endpoint, forwarding cookies
    const whoami = await fetch(new URL('/api/auth/whoami', req.url), {
      headers: { cookie: req.headers.get('cookie') ?? '' },
      cache: 'no-store',
    }).catch(() => null);

    if (!whoami || !whoami.ok) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const data = await whoami.json().catch(() => null);
    // Adjust this shape to match your whoami response.
    const isAuthed = data?.ok === true;           // or data?.user === 'admin', etc.
    if (!isAuthed) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin'],
};