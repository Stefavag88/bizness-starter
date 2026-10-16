import { z } from 'zod';

const bounded = (max: number) => z.string().trim().max(max);
export const emailSchema = z
  .email()
  .max(254)
  .refine((value) => /^[\x20-\x7E]+$/.test(value), 'Use an ASCII email address');
export const inquirySchema = z
  .object({
    requestKey: z.uuid(),
    name: bounded(120).min(1),
    email: emailSchema,
    phone: bounded(40).optional().default(''),
    contextId: bounded(80).optional().default(''),
    message: bounded(5000).min(20),
    privacyAccepted: z.literal(true),
    marketingConsent: z.boolean().optional().default(false),
    interest: bounded(40).optional(),
    turnstileToken: bounded(2048).min(1),
  })
  .strict();
export const signupSchema = z
  .object({
    requestKey: z.uuid(),
    email: emailSchema,
    name: bounded(120).optional(),
    consent: z.literal(true),
    interest: bounded(40).min(1),
    sourceArticle: bounded(80).optional(),
    turnstileToken: bounded(2048).min(1),
  })
  .strict();
export const campaignSchema = z
  .object({
    requestKey: z.uuid(),
    subject: z.string().max(150).refine((s) => !/[\r\n]/.test(s)).transform(s=>s.trim()).pipe(z.string().min(1)),
    intro: bounded(2000).min(1),
    articleId: bounded(80).optional(),
    interest: bounded(40).min(1),
  })
  .strict();
export function emailKey(email: string) {
  return email.trim().toLowerCase();
}
export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
}
export async function hash(value: string) {
  return Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))),
  )
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
export function randomToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
