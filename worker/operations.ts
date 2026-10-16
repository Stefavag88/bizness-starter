import type { Env } from './types';
import { html } from './pages';
import { escapeHtml } from '../packages/contracts';
export async function localMail(env: Env) {
  const mail = await env.DB.prepare(
    'SELECT * FROM email_capture ORDER BY created_at DESC LIMIT 50',
  ).all<{ recipient: string; subject: string; text: string }>();
  return html(
    'Local email inbox',
    '<p>These messages were captured locally. Nothing was delivered to a real recipient.</p>' +
      mail.results
        .map(
          (m) =>
            `<article><h2>${escapeHtml(m.subject)}</h2><p>To: ${escapeHtml(m.recipient)}</p><pre>${escapeHtml(m.text)}</pre></article>`,
        )
        .join(''),
  );
}
export async function overview(env: Env) {
  const jobs = await env.DB.prepare(
    'SELECT state,COUNT(*) count,MIN(created_at) oldest_at FROM email_job GROUP BY state',
  ).all();
  const inquiries = await env.DB.prepare(
    'SELECT id,name,email,context_id,status,created_at FROM inquiry ORDER BY created_at DESC LIMIT 50',
  ).all();
  return { jobs: jobs.results, inquiries: inquiries.results };
}
