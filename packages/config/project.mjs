import { z } from 'zod';
import { accessEmails } from './access.mjs';
const text = z.string().trim().min(1);
const code = z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/);
const id = z.string().regex(/^[a-z0-9_-]{1,40}$/);
const origin = z.string().refine(value => {
  try { const url = new URL(value); return url.protocol === 'https:' && url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password; }
  catch { return false; }
}, 'siteUrl must be an HTTPS origin without credentials, path, query or fragment');
const infrastructure = z.strictObject({
  databaseId: z.uuid().default('00000000-0000-0000-0000-000000000000'),
  sesRegion: text.default('eu-west-1'), sender: text.default('Example Studio <hello@example.com>'),
  notificationEmail: z.email().default('owner@example.com'), allowedRecipients: z.array(z.email()).default([]),
  sesConfigurationSet: z.string().default('starter-transactional'), snsTopicArn: z.string().default(''),
  accessIssuer: z.string().default(''), accessAudience: z.string().default(''), adminEmails: accessEmails.default([]), editorEmails: accessEmails.default([]),
  sendingEnabled: z.boolean().default(false), marketingEnabled: z.boolean().default(false), sendIntervalMs: z.number().int().min(1000).default(1000),
});
const optimization = z.strictObject({
  enabled: z.boolean().default(true),
  widths: z.array(z.number().int().min(160).max(2560)).min(1).max(6)
    .refine(widths => widths.every((width, index) => index === 0 || width > widths[index - 1]), 'Media widths must be ascending and unique')
    .default([320, 640, 960, 1440, 1920]),
  quality: z.number().int().min(40).max(95).default(80),
});
export const projectSchema = z.strictObject({
  name: z.string().regex(/^[a-z0-9-]{1,40}$/), starterVersion: z.literal('2.0.0-dev'), schemaVersion: z.literal(2),
  profile: z.enum(['enquiries','newsletter','nurture']).default('enquiries'), articles: z.boolean().default(true),
  modules: z.strictObject({rooms:z.boolean().default(false)}).prefault({}),
  locale: code, languages: z.array(z.strictObject({code, label:text})).min(1), siteUrl: origin,
  environment: z.enum(['local','staging','production']).default('local'),
  design: z.strictObject({theme:z.string().regex(/^[a-z0-9-]+$/).default('neutral'),density:z.enum(['comfortable','compact','spacious']).default('comfortable')}).default({theme:'neutral',density:'comfortable'}),
  media: z.strictObject({ optimization: optimization.prefault({}) }).prefault({}),
  infrastructure: infrastructure.prefault({}), legalReviewed:z.boolean().default(false), contentReviewed:z.boolean().default(false),
  interests:z.array(z.strictObject({id,label:text})).default([]),
}).superRefine((p,ctx) => {
  if (new Set(p.languages.map(l=>l.code)).size !== p.languages.length) ctx.addIssue({code:'custom',path:['languages'],message:'Language codes must be unique'});
  if (!p.languages.some(l=>l.code===p.locale)) ctx.addIssue({code:'custom',path:['locale'],message:'Default locale must be included in languages'});
  if (new Set(p.interests.map(i=>i.id)).size !== p.interests.length) ctx.addIssue({code:'custom',path:['interests'],message:'Interest IDs must be unique'});
});
export function parseProject(raw) { return projectSchema.parse(raw); }
