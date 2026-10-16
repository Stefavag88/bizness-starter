import { escapeHtml } from '../contracts';
export interface Message {
  to: string;
  subject: string;
  text: string;
  html: string;
  unsubscribe?: string;
  replyTo?: string;
}
export function message(
  to: string,
  subject: string,
  text: string,
  unsubscribe?: string,
  replyTo?: string,
): Message {
  if (/[\r\n]/.test(subject) || /[\r\n]/.test(to) || (replyTo && /[\r\n]/.test(replyTo)))
    throw Error('Unsafe email header');
  return {
    to,
    subject,
    text,
    unsubscribe,
    replyTo,
    html: `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#28382c;max-width:600px;margin:auto;padding:32px"><h1 style="font-family:Georgia,serif">${escapeHtml(subject)}</h1>${text
      .split('\n')
      .map((p) => `<p>${escapeHtml(p)}</p>`)
      .join(
        '',
      )}${unsubscribe ? `<p><a href="${escapeHtml(unsubscribe)}">Unsubscribe from all marketing emails</a></p>` : ''}</body></html>`,
  };
}
