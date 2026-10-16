import { it, expect } from 'vitest';
import { environment } from './db';
import { requireOrigin, scopedToken, readToken, body, admin } from '../worker/security';
import { inquirySchema, escapeHtml, emailKey } from '../packages/contracts';


it('rejects cross-origin forms and private local routes on nonlocal hosts', async () => {
  const { env } = environment();
  expect(() =>
    requireOrigin(
      new Request('http://localhost:8787/api/contact', {
        headers: { origin: 'https://evil.test' },
      }),
      env,
    ),
  ).toThrow();
  await expect(admin(new Request('https://public.test/admin/campaigns'), env)).rejects.toThrow();
});
it('tokens are scoped and tampering fails', async () => {
  const { env } = environment();
  const token = await scopedToken(env, 'subscriber', 3, 'unsubscribe');
  expect(await readToken(env, token, 'unsubscribe')).toEqual({ id: 'subscriber', generation: 3 });
  await expect(readToken(env, token, 'preferences')).rejects.toThrow();
  await expect(readToken(env, token + 'bad', 'unsubscribe')).rejects.toThrow();
});
it('bounds request streams', async () => {
  await expect(
    body(
      new Request('https://example.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: 'a'.repeat(100) }),
      }),
      20,
    ),
  ).rejects.toThrow();
});
it('requires explicit privacy acceptance and validates email', () => {
  expect(
    inquirySchema.safeParse({
      name: 'Someone',
      email: 'injection\r\n@example.com',
      message: 'Please contact me about this',
      privacyAccepted: false,
      requestKey: crypto.randomUUID(),
      turnstileToken: 'local',
    }).success,
  ).toBe(false);
  expect(escapeHtml('<script>"')).toBe('&lt;script&gt;&quot;');
  expect(emailKey(' A+B@Example.COM ')).toBe('a+b@example.com');
});
