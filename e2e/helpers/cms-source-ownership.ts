import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, realpathSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

type Field = { name: string; type: string; fields?: Field[]; list?: boolean; [key: string]: any };
type Collection = {
  name: string;
  path: string;
  fields?: Field[];
  templates?: { name: string; fields: Field[] }[];
};
type Schema = { collections: Collection[] };
type Mutation = { collection: string; relativePath: string; params: Record<string, any> };
type Predicate = (data: any) => boolean;
let serializer: Promise<any> | undefined;
function nativeSerializer() {
  // Resolve the serializer from the installed CLI backend, rather than a second Tina version.
  // This is test-only and adds no dependency or browser import.
  if (!serializer) {
    const require = createRequire(import.meta.url);
    const graphqlEntry = realpathSync(
      resolve(dirname(require.resolve('@tinacms/cli')), '../../graphql/dist/index.js'),
    );
    const backendRequire = createRequire(graphqlEntry);
    serializer = import(pathToFileURL(backendRequire.resolve('@tinacms/mdx')).href);
  }
  return serializer;
}
async function serializedFields(values: Record<string, any>, fields: Field[]): Promise<any> {
  const result: Record<string, any> = {};
  for (const [name, value] of Object.entries(values)) {
    const field = fields.find((field) => field.name === name);
    if (!field) throw Error('Unknown native mutation field: ' + name);
    if (field.type === 'rich-text') {
      const { serializeMDX } = await nativeSerializer();
      // The local repository media contract keeps image URLs relative, as the CLI does.
      result[name] = serializeMDX(value, field, (url: string) => url);
    } else if (field.type === 'object' && field.fields) {
      result[name] = Array.isArray(value)
        ? await Promise.all(value.map((item) => serializedFields(item, field.fields!)))
        : await serializedFields(value, field.fields);
     } else if (field.type === 'datetime') {
      // GraphQL buildFieldMutations uses new Date(value); JSON writes its ISO value.
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) throw Error('Invalid native datetime: ' + name);
      result[name] = date.toISOString();
    } else if (['string', 'number', 'boolean', 'image', 'reference'].includes(field.type)) {
      result[name] = structuredClone(value);
    } else throw Error('Unsupported native serialization field: ' + name);
  }
  // JSON serialization omits undefined optional rich-text values; no other normalization is allowed.
  return JSON.parse(JSON.stringify(result));
}

export function createCmsSources(paths: string[], backupRoot = '.generated/cms-roundtrip-backup') {
  const originals = new Map(paths.map((path) => [resolve(path), readFileSync(path, 'utf8')]));
  const owned = new Map<string, string>();
  const rejected = new Set<string>();
  mkdirSync(backupRoot, { recursive: true });
  const backup = mkdtempSync(join(backupRoot, 'snapshot-'));
  const backupName = (path: string) =>
    createHash('sha256').update(path).digest('hex').slice(0, 16) + '-' + basename(path);
  const sourcePath = (path: string) => {
    const full = resolve(path);
    if (!originals.has(full))
      throw Error('Mutation source does not match a backed-up source: ' + path);
    return full;
  };
  const backupFor = (path: string) => join(backup, backupName(sourcePath(path)));
  for (const [path, bytes] of originals) writeFileSync(backupFor(path), bytes);
  writeFileSync(
    join(backup, 'manifest.json'),
    JSON.stringify(
      [...originals.keys()].map((path) => ({ path, backup: backupFor(path) })),
      null,
      2,
    ),
  );
  const reject = (path: string, current: string, expected: unknown, message: string): never => {
    owned.delete(path);
    rejected.add(path);
    writeFileSync(join(backup, backupName(path) + '.unclaimed.json'), current);
    writeFileSync(
      join(backup, backupName(path) + '.expected.json'),
      JSON.stringify(expected, null, 2),
    );
    throw Error(message + ': ' + path + '; retained originals/current/expected in ' + backup);
  };
  const capture = (path: string, expected: unknown, predicate: Predicate) => {
    path = sourcePath(path);
    const current = readFileSync(path, 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(current);
    } catch {
      return reject(path, current, expected, 'Unexpected saved document');
    }
    if (!isDeepStrictEqual(parsed, expected))
      return reject(path, current, expected, 'Unexpected saved document');
    let matches = false;
    try {
      matches = predicate(parsed);
    } catch {
      return reject(path, current, expected, 'Expected edit missing');
    }
    if (!matches) return reject(path, current, expected, 'Expected edit missing');
    // Claim only this complete, expected record, never arbitrary finally-observed bytes.
    owned.set(path, current);
  };
  return {
    backup,
    backupFor,
    originalBytes: (path: string) => originals.get(sourcePath(path))!,
    owns: (path: string) => owned.has(sourcePath(path)),
    assertUnchanged() {
      for (const [path, original] of originals)
        if (rejected.has(path) || readFileSync(path, 'utf8') !== (owned.get(path) ?? original))
          throw Error('Source changed outside this test before save: ' + path);
    },
    capture,
    async captureNative(path: string, mutation: Mutation, schema: Schema, predicate: Predicate) {
      path = sourcePath(path);
      const collection = schema.collections.find(
        (collection) => collection.name === mutation.collection,
      );
      if (
        !collection ||
        !/^[^/\\]+\.json$/.test(mutation.relativePath) ||
        mutation.relativePath.includes('..') ||
        resolve(collection.path, mutation.relativePath) !== path
      )
        throw Error('Mutation source does not match the backed-up file: ' + path);
      let body = mutation.params[collection.name];
      if (!body || typeof body !== 'object' || Array.isArray(body))
        throw Error('Missing native mutation record');
      let fields = collection.fields;
      let templateName: string | undefined;
      if (collection.templates) {
        const names = Object.keys(body);
        const template =
          names.length === 1 && collection.templates.find((template) => template.name === names[0]);
        if (!template) throw Error('Unsupported native mutation template');
        templateName = template.name;
        fields = template.fields;
        body = body[template.name];
      }
      if (!fields) throw Error('Missing native mutation schema');
      const prior = JSON.parse(owned.get(path) ?? originals.get(path)!);
      if (prior._template && prior._template !== templateName)
        throw Error('Mutation template does not match the source');
      const reserved = [
        '_template',
        '_collection',
        '_relativePath',
        '_keepTemplateKey',
        '_id',
        '$_body',
      ];
      // The CLI preserves only existing top-level legacy fields outside the schema.
      // Derive them from the prior owned/original snapshot, never the newly observed file.
      const legacy = Object.fromEntries(
        Object.entries(prior).filter(
          ([name]) => !reserved.includes(name) && !fields!.some((field) => field.name === name),
        ),
      );
      const expected = {
        ...legacy,
        ...(await serializedFields(body, fields)),
        ...(templateName ? { _template: templateName } : {}),
      };
      capture(path, expected, predicate);
    },
    async restore(cleanup: () => void | Promise<void> = () => {}) {
      const conflicts = new Set(rejected);
      for (const [path, original] of originals) {
        try {
          const current = readFileSync(path, 'utf8');
          if (owned.has(path) && current === owned.get(path) && !rejected.has(path))
            writeFileSync(path, original);
          else if (current !== original) conflicts.add(path);
        } catch {
          conflicts.add(path);
        }
      }
      // Close browser resources and refresh safe restored design sources even on conflict.
      await cleanup();
      if (conflicts.size)
        throw Error(
          'Concurrent edits preserved; restore manually from ' +
            backup +
            ': ' +
            [...conflicts].join(', '),
        );
    },
  };
}
