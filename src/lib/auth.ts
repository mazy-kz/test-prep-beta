import crypto from 'crypto';
const SECRET = process.env.AUTH_SECRET || 'dev-secret';
export function sign(data: string){ return crypto.createHmac('sha256', SECRET).update(data).digest('hex'); }
export function createSession(email: string){ const sig = sign(email); return Buffer.from(JSON.stringify({e:email,s:sig})).toString('base64url'); }
export function verifySession(token?: string|null){ if(!token) return null; try{ const raw=Buffer.from(token,'base64url').toString('utf8'); const o=JSON.parse(raw) as {e:string;s:string}; return sign(o.e)===o.s?o.e:null; } catch { return null; } }
