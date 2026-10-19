import { localizedAsset } from './assets';
import project from '../project.json';
import { ZodError } from 'zod';
import { inquirySchema, signupSchema } from '../packages/contracts';
import { jobStatement, now, rateLimit } from './db';
import { HttpError, admin, editor, body, isLocal, ipKey, requireOrigin, verifyTurnstile } from './security';
import { subscribe, confirm, unsubscribe } from './newsletter';
import { deliver, dispatch, drainLocal } from './delivery';
import { createCampaign, campaignAction, fanOut } from './campaigns';
import { sesWebhook } from './webhook';
import { startEnrollments } from './workflow';
import { html, tokenPage, adminPage } from './pages';
import { localMail, overview } from './operations';
import type { Env } from './types';
import manifest from '../.generated/manifest.json';
import settings from '../content/settings/site.json';
export { WelcomeWorkflow } from './workflow';
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options':'nosniff', 'Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'" },
  });
async function scheduled(env: Env) {
  if (env.PROFILE !== 'enquiries') {
    await fanOut(env);
    await startEnrollments(env);
  }
  await dispatch(env);
  await env.DB.prepare('DELETE FROM rate_limit WHERE expires_at<?').bind(now()).run();
  await env.DB.prepare('DELETE FROM action_token WHERE expires_at<?')
    .bind(now() - 86400000)
    .run();
}
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url),
      path = url.pathname;
    const requestId = crypto.randomUUID();
    try {
      if (path === '/') return Response.redirect(new URL('/'+project.locale,request.url),302);
      if (path === '/api/health') return json({ ok: true, profile: env.PROFILE });
      if (path === '/admin/local-mail' && request.method === 'GET') {
        if (!isLocal(request, env)) throw new HttpError(404, 'Not found.');
        return localMail(env);
      }
      if (path === '/api/operations/overview' && request.method === 'GET') {
        await admin(request, env);
        return json(await overview(env));
      }
      if (path === '/cms' || path.startsWith('/cms/')) {
        await editor(request, env);
        return env.ASSETS.fetch(request);
      }
      if (path.startsWith('/api/local/')) {
        if (!isLocal(request, env)) throw new HttpError(404, 'Not found.');
        if (path === '/api/local/emails' && request.method === 'GET')
          return json({
            emails: (
              await env.DB.prepare(
                'SELECT * FROM email_capture ORDER BY created_at DESC LIMIT 50',
              ).all()
            ).results,
          });
        if (path === '/api/local/tick' && request.method === 'POST') {
          requireOrigin(request, env);
          await fanOut(env);
          await startEnrollments(env);
          await drainLocal(env);
          return json({ ok: true });
        }
        throw new HttpError(404, 'Not found.');
      }
      if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
        if (env.PROFILE === 'enquiries') throw new HttpError(404, 'Not found.');
        const user = await admin(request, env);
        if (path === '/admin/campaigns' && request.method === 'GET') return adminPage(env);
        if (path === '/api/admin/campaign-sources' && request.method === 'GET')
          return json(manifest);
        if (path === '/api/admin/campaigns' && request.method === 'GET')
          return json({
            campaigns: (
              await env.DB.prepare(
                `SELECT c.*,(SELECT COUNT(*) FROM subscriber s JOIN subscriber_interest i ON s.id=i.subscriber_id WHERE s.status='active' AND i.interest_id=c.interest_id) AS audience_count FROM campaign c ORDER BY created_at DESC LIMIT 50`,
              ).all()
            ).results,
          });
        requireOrigin(request, env);
        if (path === '/api/admin/campaigns' && request.method === 'POST')
          return json(await createCampaign(env, await body(request)), 201);
        const action = path.match(
          /^\/api\/admin\/campaigns\/([0-9a-f-]+)\/(test|approve|send|pause)$/,
        );
        if (action && request.method === 'POST') {
          await campaignAction(env, action[1], action[2], await body(request), user);
          if (isLocal(request, env)) ctx.waitUntil(fanOut(env).then(() => drainLocal(env)));
          return json({ message: 'Action accepted', requestId }, 202);
        }
        throw new HttpError(404, 'Not found.');
      }
      if (path === '/api/webhooks/ses' && request.method === 'POST') {
        // SNS commonly sends text/plain JSON; bounded parser is shared with JSON APIs.
        const raw = await request.text();
        if (raw.length > 65536) throw new HttpError(413, 'Too large.');
        await sesWebhook(env, JSON.parse(raw));
        return json({ ok: true });
      }
      if (path.startsWith('/newsletter/') || path.startsWith('/api/newsletter/')) {
        if (env.PROFILE === 'enquiries') throw new HttpError(404, 'Not found.');
        if (request.method === 'GET' && path === '/newsletter/confirm')
          return tokenPage('confirm', url.searchParams.get('token') || '');
        if (
          request.method === 'GET' &&
          (path === '/newsletter/unsubscribe' || path === '/api/newsletter/unsubscribe')
        )
          return tokenPage('unsubscribe', url.searchParams.get('token') || '');
        if (
          request.method === 'POST' &&
          (path === '/api/newsletter/confirm' || path === '/api/newsletter/unsubscribe')
        ) {
          if (path.endsWith('confirm')) requireOrigin(request, env);
          const raw = await request.text();
          if (raw.length > 4096) throw new HttpError(413, 'Too large.');
          const fields = new URLSearchParams(raw);
          const token = url.searchParams.get('token') || fields.get('token') || '';
          if (path.endsWith('confirm')) await confirm(env, token);
          else await unsubscribe(env, token);
          if (isLocal(request, env)) ctx.waitUntil(drainLocal(env));
          return html(
            path.endsWith('confirm') ? 'You’re confirmed' : 'You’re unsubscribed',
            '<p>Your request has been completed.</p>',
          );
        }
        if (path === '/api/newsletter/subscribe' && request.method === 'POST') {
          requireOrigin(request, env);
          const data = signupSchema.parse(await body(request, 8192));
          if (data.sourceArticle && !manifest.articles.some((a) => a.id === data.sourceArticle))
            throw new HttpError(400, 'Unknown source article.');
          if (!(await rateLimit(env, await ipKey(request), 10)))
            throw new HttpError(429, 'Please wait before trying again.');
          await verifyTurnstile(request, env, data.turnstileToken, 'subscribe');
          await subscribe(env, data);
          if (isLocal(request, env)) ctx.waitUntil(drainLocal(env));
          return json(
            { message: 'If appropriate, check your inbox for a confirmation link.', requestId },
            202,
          );
        }
        throw new HttpError(404, 'Not found.');
      }
      if (path === '/api/contact' && request.method === 'POST') {
        requireOrigin(request, env);
        const data = inquirySchema.parse(await body(request));
        if (data.contextId && !manifest.enquiryContexts.some((context) => context.id === data.contextId))
          throw new HttpError(400, 'Unknown enquiry context.');
        if (!(await rateLimit(env, await ipKey(request), 10)))
          throw new HttpError(429, 'Please wait before trying again.');
        await verifyTurnstile(request, env, data.turnstileToken, 'contact');
        await env.DB.batch([
          env.DB.prepare(
            'INSERT OR IGNORE INTO inquiry(id,request_key,name,email,phone,context_id,message,privacy_version,marketing_requested,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
          ).bind(
            crypto.randomUUID(),
            data.requestKey,
            data.name,
            data.email,
            data.phone,
            data.contextId,
            data.message,
            settings.legal.privacyVersion,
            Number(data.marketingConsent),
            now(),
          ),
          jobStatement(env, `inquiry:${data.requestKey}`, 'inquiry', {
            name: data.name,
            email: data.email,
            phone: data.phone,
            message: data.message,
          }),
        ]);
        if (data.marketingConsent && env.PROFILE !== 'enquiries')
          await subscribe(env, {
            requestKey: data.requestKey,
            email: data.email,
            name: data.name,
            consent: true,
            interest: data.interest,
            turnstileToken: data.turnstileToken,
          });
        if (isLocal(request, env)) ctx.waitUntil(drainLocal(env));
        return json({ message: 'Thank you. Your enquiry has been received.', requestId }, 202);
      }
      if (path.startsWith('/api/') || path.startsWith('/admin'))
        throw new HttpError(404, 'Not found.');
      return localizedAsset(request, r=>env.ASSETS.fetch(r), project.languages.map(l=>l.code));
    } catch (error) {
      const status =
        error instanceof HttpError ? error.status : error instanceof ZodError ? 400 : 500;
      if (status === 500)
        console.error(JSON.stringify({ requestId, error: 'internal_error', path }));
      return json(
        {
          requestId,
          ...(error instanceof ZodError?{errors:error.issues.map(issue=>({name:String(issue.path[0]||''),message:issue.message}))}:{}),
          message:
            error instanceof HttpError
              ? error.message
              : error instanceof ZodError
                ? 'Please check the required fields.'
                : 'Something went wrong. Please try again.',
        },
        status,
      );
    }
  },
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(scheduled(env));
  },
  async queue(batch: MessageBatch<unknown>, env: Env) {
    for (const message of batch.messages) {
      try {
        const data = message.body as { id?: unknown };
        if (typeof data?.id !== 'string') {
          message.ack();
          continue;
        }
        await deliver(env, data.id);
        message.ack();
      } catch {
        message.retry({ delaySeconds: 60 });
      }
      if (env.ENVIRONMENT !== 'local')
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(1000, Number(env.SEND_INTERVAL_MS) || 1000)),
        );
    }
  },
} satisfies ExportedHandler<Env, unknown, { id: string }>;
