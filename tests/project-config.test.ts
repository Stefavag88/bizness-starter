import { describe, expect, it } from 'vitest';
import { parseProject } from '../packages/config/project.mjs';

const valid = () => ({ name: 'neutral-example', starterVersion: '2.0.0-dev', schemaVersion: 2, profile: 'enquiries', articles: true, locale: 'en', languages: [{code:'en',label:'English'}, {code:'el',label:'Ελληνικά'}], siteUrl: 'https://example.com', environment:'local', design:{theme:'neutral',density:'comfortable'}, infrastructure:{}, legalReviewed:false, contentReviewed:false, interests:[{id:'updates',label:'Useful updates'}] });
describe('project configuration boundary', () => {
  it('accepts configured locales and preserves disabled sending defaults', () => { const p = parseProject(valid()); expect(p.languages.map(l => l.code)).toEqual(['en','el']); expect(p.infrastructure.sendingEnabled).toBe(false); expect(p.infrastructure.marketingEnabled).toBe(false); });
  it.each([
    ['duplicate languages', { languages:[{code:'en',label:'English'},{code:'en',label:'Duplicate'}] }],
    ['missing default language', {locale:'fr'}], ['unknown profile', {profile:'sales'}],
    ['unsupported schema version', {schemaVersion:1}], ['unknown configuration key', {secret:'not-allowed'}],
    ['unknown nested configuration key', {infrastructure:{secret:'not-allowed'}}],
    ['insecure URL', {siteUrl:'http://example.com'}], ['URL path', {siteUrl:'https://example.com/path'}],
    ['URL query', {siteUrl:'https://example.com/?a=1'}], ['URL fragment', {siteUrl:'https://example.com/#a'}],
    ['URL credentials', {siteUrl:'https://user:pass@example.com'}], ['invalid URL', {siteUrl:'invalid'}],
    ['duplicate interests', {interests:[{id:'updates',label:'One'},{id:'updates',label:'Two'}]}],
  ])('rejects %s with an actionable error', (_name, patch) => { expect(() => parseProject({...valid(),...patch})).toThrow(); });
  it('keeps the input immutable', () => { const raw = valid(); parseProject(raw); expect(raw.infrastructure).toEqual({}); });
});
it('defaults missing infrastructure with both sending capabilities disabled', () => { const {infrastructure: _omitted,...raw}=valid(); const p=parseProject(raw); expect(p.infrastructure.sendingEnabled).toBe(false); expect(p.infrastructure.marketingEnabled).toBe(false); });

it.each(['comfortable', 'compact', 'spacious'] as const)('accepts %s density without changing the selected theme', (density) => {
  const raw = { ...valid(), design: { theme: 'trades', density } };
  expect(parseProject(raw).design).toMatchObject({ theme: 'trades', density });
});
it.each(['dense', '', 'SPACIOUS', 1, null])('rejects unsupported density %s', (density) => {
  expect(() => parseProject({ ...valid(), design: { theme: 'neutral', density } })).toThrow();
});

it('defaults role lists to empty and normalizes explicit identities without mutating input',()=>{
 const defaults=parseProject(valid()).infrastructure;expect(defaults).toMatchObject({adminEmails:[],editorEmails:[]});
 const raw={...valid(),infrastructure:{adminEmails:[' Admin1@Example.COM ','admin2@example.com'],editorEmails:['editor@example.com','admin1@example.com']}};
 expect(parseProject(raw).infrastructure).toMatchObject({adminEmails:['admin1@example.com','admin2@example.com'],editorEmails:['editor@example.com','admin1@example.com']});expect(raw.infrastructure.adminEmails[0]).toBe(' Admin1@Example.COM ');
});
it.each([{adminEmail:''},{adminEmails:'admin@example.com'},{adminEmails:['']},{editorEmails:['*']},{adminEmails:['a@example.com',' A@EXAMPLE.COM ']},{editorEmails:['a@example.com','a@example.com']},{editorEmails:[2]}])('rejects malformed or legacy role configuration %j', infrastructure=>{expect(()=>parseProject({...valid(),infrastructure})).toThrow();});
import { fixture } from './fixtures/content/factory';
import { createCmsDescriptor } from '../scripts/cms-descriptor.mjs';

describe('bounded developer media optimization policy', () => {
  const defaults = { enabled: true, widths: [320, 640, 960, 1440, 1920], quality: 80 };
  it.each([undefined, {}, { optimization: {} }])('defaults absent nested media policy %j', media => {
    expect(parseProject({ ...valid(), ...(media === undefined ? {} : { media }) }).media.optimization).toEqual(defaults);
  });
  it('defaults partial settings and preserves disabled mode', () => {
    expect(parseProject({ ...valid(), media: { optimization: { enabled: false } } }).media.optimization).toEqual({ ...defaults, enabled: false });
    expect(parseProject({ ...valid(), media: { optimization: { quality: 95 } } }).media.optimization).toEqual({ ...defaults, quality: 95 });
    expect(parseProject({ ...valid(), media: { optimization: { widths: [160, 2560] } } }).media.optimization).toEqual({ ...defaults, widths: [160, 2560] });
  });
  it('accepts a complete bounded policy without mutating it', () => {
    const media = { optimization: { enabled: true, widths: [160, 320, 640, 960, 1920, 2560], quality: 40 } };
    expect(parseProject({ ...valid(), media }).media).toEqual(media);
    expect(media.optimization.widths).toEqual([160, 320, 640, 960, 1920, 2560]);
  });
  it.each([
    { widths: [] }, { widths: [160, 320, 640, 960, 1440, 1920, 2560] },
    { widths: [320, 320] }, { widths: [640, 320] }, { widths: [320.5] },
    { widths: [159] }, { widths: [2561] }, { widths: ['320'] },
    { quality: 39 }, { quality: 96 }, { quality: 80.5 }, { quality: '80' },
    { enabled: 'false' }, { extra: true },
  ])('rejects invalid policy %j even when disabled', optimization => {
    expect(() => parseProject({ ...valid(), media: { optimization: { enabled: false, ...optimization } } })).toThrow();
  });
  it.each([{ extra: true }, { optimization: null }, null])('rejects unknown or malformed media settings %j', media => {
    expect(() => parseProject({ ...valid(), media })).toThrow();
  });
  it('keeps developer optimization settings outside the CMS descriptor', () => {
    const f = fixture();
    const before = createCmsDescriptor(f.root, parseProject(valid()));
    const after = createCmsDescriptor(f.root, parseProject({ ...valid(), media: { optimization: { enabled: false, widths: [2560], quality: 95 } } }));
    expect(after).toEqual(before);
    expect(after.project).not.toHaveProperty('media');
  });
});
