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
  // Investigate by job/provider IDs; never include email payloads or token bodies.
  const deliveries = await env.DB.prepare(
    `SELECT id,kind,state,attempts,error_code,provider_message_id,created_at,available_at,lease_until,accepted_at
     FROM email_job WHERE state IN ('unknown','failed') OR (state IN ('queued','sending') AND lease_until<?)
     ORDER BY created_at LIMIT 100`,
  ).bind(Date.now()).all();
  const enrollments = await env.DB.prepare(
    "SELECT state,COUNT(*) count FROM automation_enrollment GROUP BY state",
  ).all();
  return { jobs: jobs.results, inquiries: inquiries.results, deliveries: deliveries.results, enrollments: enrollments.results };
}
