import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep, basename } from 'node:path';
import { createCmsSources } from '../e2e/helpers/cms-source-ownership';
const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) {
    if (
      !resolve(root).startsWith(resolve(tmpdir()) + sep) ||
      !basename(root).startsWith('cms-source-ownership-')
    )
      throw Error('Refusing to delete a test directory outside the task temporary root');
    rmSync(root, { recursive: true, force: true });
  }
});
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'cms-source-ownership-'));
  roots.push(root);
  const path = join(root, 'about.json');
  const original = '{"meta":{"title":"Original About"},"body":"Original body"}\n';
  const expected = { meta: { title: 'Original About' }, body: '**About probe**\n' };
  writeFileSync(path, original);
  const sources = createCmsSources([path], join(root, 'backups'));
  return { path, original, expected, sources };
}
it('restores a matching complete native save to its exact original bytes', async () => {
  const { path, original, expected, sources } = fixture();
  writeFileSync(path, JSON.stringify({ body: expected.body, meta: expected.meta }, null, 2));
  sources.capture(path, expected, (data) => data.body.includes('About probe'));
  expect(sources.owns(path)).toBe(true);
  sources.assertUnchanged();
  await sources.restore();
  expect(readFileSync(path, 'utf8')).toBe(original);
  expect(readFileSync(sources.backupFor(path), 'utf8')).toBe(original);
});
it('preserves an unrelated post-save metadata edit before capture and never claims it', async () => {
  const { path, original, expected, sources } = fixture();
  const concurrent = JSON.stringify({ ...expected, meta: { title: 'User edited About' } });
  writeFileSync(path, concurrent);
  expect(() =>
    sources.capture(path, expected, (data) => data.body.includes('About probe')),
  ).toThrow('Unexpected saved document');
  expect(sources.owns(path)).toBe(false);
  await expect(sources.restore()).rejects.toThrow('Concurrent edits preserved');
  expect(readFileSync(path, 'utf8')).toBe(concurrent);
  expect(readFileSync(sources.backupFor(path), 'utf8')).toBe(original);
});
it('does not claim bytes when the intended edit predicate fails', async () => {
  const { path, expected, sources } = fixture();
  const current = JSON.stringify(expected);
  writeFileSync(path, current);
  expect(() => sources.capture(path, expected, () => false)).toThrow('Expected edit missing');
  expect(sources.owns(path)).toBe(false);
  await expect(sources.restore()).rejects.toThrow('Concurrent edits preserved');
  expect(readFileSync(path, 'utf8')).toBe(current);
});
it('restores every safe file and always cleans up while preserving multiple conflicts', async () => {
  const { path, expected, sources: unused } = fixture();
  const root = roots.at(-1)!;
  const safe = join(root, 'services.json'),
    other = join(root, 'contact.json');
  writeFileSync(safe, '{"title":"Original Services"}\n');
  writeFileSync(other, '{"title":"Original Contact"}\n');
  const sources = createCmsSources([path, safe, other], join(root, 'more-backups'));
  writeFileSync(safe, '{"title":"Services probe"}');
  sources.capture(safe, { title: 'Services probe' }, () => true);
  writeFileSync(path, JSON.stringify({ ...expected, meta: { title: 'User About' } }));
  writeFileSync(other, '{"title":"User Contact"}');
  let cleaned = false;
  await expect(
    sources.restore(() => {
      cleaned = true;
    }),
  ).rejects.toThrow('Concurrent edits preserved');
  expect(cleaned).toBe(true);
  expect(readFileSync(safe, 'utf8')).toBe('{"title":"Original Services"}\n');
  expect(JSON.parse(readFileSync(path, 'utf8')).meta.title).toBe('User About');
  expect(JSON.parse(readFileSync(other, 'utf8')).title).toBe('User Contact');
});
it('rejects edits before another save and edits after ownership capture', async () => {
  const { path, expected, sources } = fixture();
  writeFileSync(path, JSON.stringify(expected));
  sources.capture(path, expected, () => true);
  const concurrent = JSON.stringify({ ...expected, body: 'External replacement' });
  writeFileSync(path, concurrent);
  expect(() => sources.assertUnchanged()).toThrow('Source changed outside this test');
  await expect(sources.restore()).rejects.toThrow('Concurrent edits preserved');
  expect(readFileSync(path, 'utf8')).toBe(concurrent);
});

it('matches native bold rich-text serialization while retaining all other fields', async () => {
  const { path, sources } = fixture();
  const root = roots.at(-1)!;
  const schema = {
    collections: [
      {
        name: 'page',
        path: root,
        templates: [
          {
            name: 'about',
            fields: [
              { name: 'meta', type: 'object', fields: [{ name: 'title', type: 'string' }] },
              { name: 'body', type: 'rich-text' },
            ],
          },
        ],
      },
    ],
  };
  const variables = {
    collection: 'page',
    relativePath: 'about.json',
    params: {
      page: {
        about: {
          meta: { title: 'Original About' },
          body: {
            type: 'root',
            children: [
              { type: 'p', children: [{ type: 'text', text: 'About probe', bold: true }] },
            ],
          },
        },
      },
    },
  };
  const expected = {
    meta: { title: 'Original About' },
    body: '**About probe**\n',
    _template: 'about',
  };
  writeFileSync(path, JSON.stringify(expected));
  await sources.captureNative(path, variables, schema, (data) => data.body === '**About probe**\n');
  expect(sources.owns(path)).toBe(true);
  await sources.restore();
});
it.each(['../about.json', '/about.json', 'elsewhere.json'])(
  'rejects mutation source identity %s',
  async (relativePath) => {
    const { path, sources } = fixture();
    const root = roots.at(-1)!;
    const schema = {
      collections: [{ name: 'page', path: root, fields: [{ name: 'body', type: 'string' }] }],
    };
    await expect(
      sources.captureNative(
        path,
        { collection: 'page', relativePath, params: { page: { body: 'probe' } } },
        schema,
        () => true,
      ),
    ).rejects.toThrow('Mutation source does not match');
    expect(sources.owns(path)).toBe(false);
  },
);

it('never claims a concurrent metadata edit through the native request serializer', async () => {
  const { path, sources } = fixture();
  const root = roots.at(-1)!;
  const schema = {
    collections: [
      {
        name: 'page',
        path: root,
        templates: [
          {
            name: 'about',
            fields: [
              { name: 'meta', type: 'object', fields: [{ name: 'title', type: 'string' }] },
              { name: 'body', type: 'rich-text' },
            ],
          },
        ],
      },
    ],
  };
  const variables = {
    collection: 'page',
    relativePath: 'about.json',
    params: {
      page: {
        about: {
          meta: { title: 'Original About' },
          body: {
            type: 'root',
            children: [{ type: 'p', children: [{ text: 'About probe', bold: true }] }],
          },
        },
      },
    },
  };
  const concurrent = JSON.stringify({
    meta: { title: 'User title after native save' },
    body: '**About probe**\n',
    _template: 'about',
  });
  writeFileSync(path, concurrent);
  await expect(
    sources.captureNative(path, variables, schema, (data) => data.body.includes('About probe')),
  ).rejects.toThrow('Unexpected saved document');
  expect(sources.owns(path)).toBe(false);
  await expect(sources.restore()).rejects.toThrow('Concurrent edits preserved');
  expect(readFileSync(path, 'utf8')).toBe(concurrent);
});
it('rejects a mutation for another collection before claiming source bytes', async () => {
  const { path, sources } = fixture();
  const root = roots.at(-1)!;
  const schema = {
    collections: [{ name: 'page', path: root, fields: [{ name: 'body', type: 'string' }] }],
  };
  await expect(
    sources.captureNative(
      path,
      {
        collection: 'offering',
        relativePath: 'about.json',
        params: { offering: { body: 'probe' } },
      },
      schema,
      () => true,
    ),
  ).rejects.toThrow('Mutation source does not match');
  expect(sources.owns(path)).toBe(false);
});

it('serializes native datetime null and ISO values without guessing persisted bytes', async () => {
 const {path,sources}=fixture();
 const schema={collections:[{name:'page',path:roots.at(-1)!,fields:[{name:'body',type:'string'},{name:'publishAt',type:'datetime'},{name:'updatedAt',type:'datetime'}]}]};
 const params={body:'Dated probe',publishAt:null,updatedAt:'2026-10-16T10:00:00.000Z'};
 writeFileSync(path,JSON.stringify({...params,publishAt:'1970-01-01T00:00:00.000Z',meta:{title:'Original About'}}));
 await sources.captureNative(path,{collection:'page',relativePath:'about.json',params:{page:params}},schema,d=>d.publishAt==='1970-01-01T00:00:00.000Z');
 await sources.restore();
});
it('normalizes a native datetime timezone as the installed backend does',async()=>{
 const {path,sources}=fixture();const schema={collections:[{name:'page',path:roots.at(-1)!,fields:[{name:'body',type:'string'},{name:'publishAt',type:'datetime'}]}]};
 writeFileSync(path,JSON.stringify({meta:{title:'Original About'},body:'Dated',publishAt:'2026-10-16T10:00:00.000Z'}));
 await sources.captureNative(path,{collection:'page',relativePath:'about.json',params:{page:{body:'Dated',publishAt:'2026-10-16T13:00:00+03:00'}}},schema,()=>true);await sources.restore();
});

it('owns and removes an initially absent complete native create with one wire slash',async()=>{
 const {path}=fixture();const root=roots.at(-1)!;const created=join(root,'created.json');
 const sources=createCmsSources([path,created],join(root,'create-backups'),{allowCreate:true});
 expect(sources.originalState(created)).toEqual({exists:false});sources.assertUnchanged();
 writeFileSync(created,JSON.stringify({body:'Created'}));
 await sources.captureNative(created,{operation:'create',collection:'page',relativePath:'/created.json',params:{page:{body:'Created'}}},{collections:[{name:'page',path:root,fields:[{name:'body',type:'string'}]}]},()=>true);
 await sources.restore();expect(()=>readFileSync(created)).toThrow();
});
it('preserves an unclaimed creation and its absent original manifest',async()=>{
 fixture();const root=roots.at(-1)!;const path=join(root,'created.json');const sources=createCmsSources([path],join(root,'create-backups'),{allowCreate:true});
 writeFileSync(path,'{"body":"External"}');expect(()=>sources.capture(path,{body:'Expected'},()=>true)).toThrow('Unexpected saved document');
 await expect(sources.restore()).rejects.toThrow('Concurrent edits preserved');expect(readFileSync(path,'utf8')).toBe('{"body":"External"}');
 expect(readFileSync(join(sources.backup,'manifest.json'),'utf8')).toContain('"exists": false');
});
it('preserves a concurrent edit after an owned creation',async()=>{
 fixture();const root=roots.at(-1)!;const path=join(root,'created.json');const sources=createCmsSources([path],join(root,'create-backups'),{allowCreate:true});
 writeFileSync(path,'{"body":"Owned"}');sources.capture(path,{body:'Owned'},()=>true);writeFileSync(path,'{"body":"External"}');
 await expect(sources.restore()).rejects.toThrow('Concurrent edits preserved');expect(readFileSync(path,'utf8')).toBe('{"body":"External"}');
});
it('retains the external and expected records when restore detects an edit after capture',async()=>{
 const {path,expected,sources}=fixture();writeFileSync(path,JSON.stringify(expected));sources.capture(path,expected,()=>true);writeFileSync(path,'{"body":"External"}');await expect(sources.restore()).rejects.toThrow('Concurrent edits preserved');
 expect(readFileSync(sources.backupFor(path)+'.unclaimed.json','utf8')).toBe('{"body":"External"}');
 expect(JSON.parse(readFileSync(sources.backupFor(path)+'.expected.json','utf8'))).toEqual(expected);
});
it('revokes prior ownership when native expectation derivation fails and preserves diagnostic inputs',async()=>{
 const {path,expected,sources}=fixture();const current=JSON.stringify(expected);writeFileSync(path,current);sources.capture(path,expected,()=>true);
 await expect(sources.captureNative(path,{operation:'update',collection:'page',relativePath:'about.json',params:{page:{unknown:'unexpected'}}},{collections:[{name:'page',path:roots.at(-1)!,fields:[{name:'body',type:'string'}]}]},()=>true)).rejects.toThrow('Unknown native mutation field');
 expect(sources.owns(path)).toBe(false);await expect(sources.restore()).rejects.toThrow('Concurrent edits preserved');expect(readFileSync(path,'utf8')).toBe(current);
 expect(JSON.parse(readFileSync(sources.backupFor(path)+'.expected.json','utf8')).unprovenMutation.params.page).toEqual({unknown:'unexpected'});
});
