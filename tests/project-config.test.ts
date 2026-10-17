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
  expect(parseProject(raw).design).toEqual({ theme: 'trades', density });
});
it.each(['dense', '', 'SPACIOUS', 1, null])('rejects unsupported density %s', (density) => {
  expect(() => parseProject({ ...valid(), design: { theme: 'neutral', density } })).toThrow();
});
