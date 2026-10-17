import { jwtVerify, createRemoteJWKSet, SignJWT } from 'jose';
import { hash } from '../packages/contracts';
import type { Env } from './types';
import { accessEmail, accessEmails } from '../packages/config/access.mjs';
const encoder = new TextEncoder();
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function isLocal(request: Request, env: Env) {
  return (
    env.ENVIRONMENT === 'local' &&
    ['127.0.0.1', 'localhost', '[::1]'].includes(new URL(request.url).hostname)
  );
}
function localOrigins(env: Env):string[] {
 try { const values:unknown=JSON.parse(env.LOCAL_ORIGINS || '[]');
 return Array.isArray(values)?values.filter((value):value is string=>typeof value==='string' && /^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(value)):[];
 } catch {return [];}
}
export function requireOrigin(request: Request, env: Env) {
  const origin = request.headers.get('origin');
  if (
    !origin ||
    (origin !== new URL(env.SITE_URL).origin &&
      !(
        isLocal(request, env) &&
        localOrigins(env).includes(origin)
      ))
  )
    throw new HttpError(403, 'Request origin is not allowed.');
}
export async function body(request: Request, max = 16384) {
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    throw new HttpError(415, 'Send JSON.');
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Missing request body.');
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > max) {
      await reader.cancel();
      throw new HttpError(413, 'Request is too large.');
    }
    chunks.push(value);
  }
  const buffer = new Uint8Array(bytes);
  let offset = 0;
  for (const c of chunks) {
    buffer.set(c, offset);
    offset += c.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(buffer));
  } catch {
    throw new HttpError(400, 'Invalid JSON.');
  }
}
export async function verifyTurnstile(request: Request, env: Env, token: string, action: string) {
  if (isLocal(request, env)) return;
  if (!env.TURNSTILE_SECRET) throw new HttpError(503, 'Form protection is not configured.');
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token }),
  });
  const data = (await response.json()) as { success: boolean; hostname: string; action: string };
  if (!data.success || data.hostname !== new URL(env.SITE_URL).hostname || data.action !== action)
    throw new HttpError(400, 'Please complete the security check again.');
}
export async function ipKey(request: Request) {
  return hash(request.headers.get('cf-connecting-ip') || 'local');
}
function secret(env: Env) {
  if (env.TOKEN_SECRET) return encoder.encode(env.TOKEN_SECRET);
  if (env.ENVIRONMENT === 'local')
    return encoder.encode('local-only-replace-before-deployment-00000000');
  throw new HttpError(503, 'Token signing is not configured.');
}
export async function scopedToken(
  env: Env,
  subject: string,
  generation: number,
  purpose: string,
  expiry = '365d',
) {
  return new SignJWT({ generation, purpose })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(subject)
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(secret(env));
}
export async function readToken(env: Env, token: string, purpose: string) {
  try {
    const { payload } = await jwtVerify(token, secret(env), { algorithms: ['HS256'] });
    if (payload.purpose !== purpose || !payload.sub || !Number.isInteger(payload.generation))
      throw Error();
    return { id: payload.sub, generation: payload.generation as number };
  } catch {
    throw new HttpError(400, 'This link is invalid or has expired.');
  }
}
const keys = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
function roleLists(env: Env) {
  try {
    return {
      admins: accessEmails.parse(JSON.parse(env.ADMIN_EMAILS)),
      editors: accessEmails.parse(JSON.parse(env.EDITOR_EMAILS)),
    };
  } catch {
    throw new HttpError(503, 'Access roles are not configured.');
  }
}
async function authorize(request: Request, env: Env, role: 'admin' | 'editor') {
  if (isLocal(request, env)) return 'local-developer';
  const lists = roleLists(env);
  if (!env.ACCESS_ISSUER || !env.ACCESS_AUDIENCE)
    throw new HttpError(503, 'Administration is not configured.');
  const issuer = env.ACCESS_ISSUER.replace(/\/$/, '');
  if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer))
    throw new HttpError(503, 'Invalid Access issuer.');
  let key = keys.get(issuer);
  if (!key) {
    key = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));
    keys.set(issuer, key);
  }
  try {
    const { payload } = await jwtVerify(request.headers.get('cf-access-jwt-assertion') || '', key, {
      issuer,
      audience: env.ACCESS_AUDIENCE,
      algorithms: ['RS256'],
      requiredClaims: ['exp', 'email'],
    });
    const email = accessEmail.parse(payload.email);
    if (!lists.admins.includes(email) && !(role === 'editor' && lists.editors.includes(email)))
      throw Error();
    return email;
  } catch {
    throw new HttpError(403, role === 'admin' ? 'Administrator access is required.' : 'Editor access is required.');
  }
}
export async function admin(request: Request, env: Env) {
  return authorize(request, env, 'admin');
}
export async function editor(request: Request, env: Env) {
  return authorize(request, env, 'editor');
}