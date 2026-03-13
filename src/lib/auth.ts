import crypto from 'crypto';

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is required. Add it to your environment variables.');
  }
  return secret;
}

export function sign(data: string) {
  return crypto.createHmac('sha256', getSecret()).update(data).digest('hex');
}

export function createSession(email: string) {
  const sig = sign(email);
  return Buffer.from(JSON.stringify({ e: email, s: sig })).toString('base64url');
}

export function verifySession(token?: string | null) {
  if (!token) return null;

  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const payload = JSON.parse(raw) as { e: string; s: string };
    return sign(payload.e) === payload.s ? payload.e : null;
  } catch {
    return null;
  }
}
