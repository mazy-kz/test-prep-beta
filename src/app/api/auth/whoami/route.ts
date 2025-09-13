import { NextResponse } from 'next/server'; import { verifySession } from '@/lib/auth';
export async function GET(req: Request){ const cookie = (req.headers.get('cookie')||'').split(';').find(x=>x.trim().startsWith('admin_session=')); const val=cookie?decodeURIComponent(cookie.split('=')[1]):''; const email=verifySession(val); return NextResponse.json({email}); }
