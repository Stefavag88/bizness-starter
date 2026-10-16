import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync, unlinkSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';

import {expectedNativeDocument,nativeDocumentPath,type Mutation,type Schema} from './native-document';
type Predicate=(data:any)=>boolean;

export function createCmsSources(paths: string[], backupRoot = '.generated/cms-roundtrip-backup', options: {allowCreate?:boolean} = {}) {
  const originals = new Map(paths.map((path) => [resolve(path), !existsSync(path) && options.allowCreate ? undefined : readFileSync(path, 'utf8')]));
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
  for (const [path, bytes] of originals) if(bytes!==undefined) writeFileSync(backupFor(path), bytes);
  writeFileSync(
    join(backup, 'manifest.json'),
    JSON.stringify(
      [...originals.keys()].map((path) => ({ path, exists: originals.get(path)!==undefined, backup: backupFor(path) })),
      null,
      2,
    ),
  );
  const revoke = (path: string, current: string | undefined, failure?: unknown) => {
    const expected = owned.get(path) ?? originals.get(path);
    const previouslyRejected = rejected.has(path);
    // Revoke before optional diagnostic writes; their failure must not retain a claim.
    owned.delete(path);
    rejected.add(path);
    if (previouslyRejected) return;
    writeFileSync(
      join(backup, backupName(path) + '.expected.json'),
      expected ?? JSON.stringify({ exists: false }),
    );
    writeFileSync(
      join(backup, backupName(path) + '.unclaimed.json'),
      current ?? JSON.stringify(failure
        ? { unreadable: true, error: String(failure) }
        : { exists: false }),
    );
  };
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
    originalBytes: (path: string) => {const bytes=originals.get(sourcePath(path));if(bytes===undefined)throw Error('Original source was absent');return bytes;},
    originalState: (path:string) => {const bytes=originals.get(sourcePath(path));return bytes===undefined?{exists:false}:{exists:true,bytes};},
    owns: (path: string) => owned.has(sourcePath(path)),
    assertUnchanged() {
      for (const [path, original] of originals) {
        try {
          const current = existsSync(path) ? readFileSync(path, 'utf8') : undefined;
          if (!rejected.has(path) && current === (owned.get(path) ?? original)) continue;
          revoke(path, current);
        } catch (error) {
          try {
            revoke(path, undefined, error);
          } catch {
            // Claim is already revoked, even if evidence storage failed.
          }
          throw Error('Source changed outside this test before save: ' + path, { cause: error });
        }
        throw Error('Source changed outside this test before save: ' + path);
      }
    },
    capture,
    async captureNative(path: string, mutation: Omit<Mutation,'operation'> & {operation?:Mutation['operation']}, schema: Schema, predicate: Predicate) {
      path = sourcePath(path);
      const request:Mutation={...mutation,operation:mutation.operation??'update'};
      try {
        if(nativeDocumentPath(request,schema)!==path)throw Error('Mutation source does not match the backed-up file: '+path);
        const priorBytes=owned.get(path)??originals.get(path);
        const expected=await expectedNativeDocument(request,schema,priorBytes===undefined?undefined:JSON.parse(priorBytes));
        capture(path, expected, predicate);
      } catch(error) {
        // A failed new proof revokes any earlier claim. Keep the inputs when no
        // expected record could be derived; they are never treated as owned bytes.
        if(!rejected.has(path)) reject(path,existsSync(path)?readFileSync(path,'utf8'):JSON.stringify({exists:false}),{unprovenMutation:request},error instanceof Error?error.message:String(error));
        throw error;
      }
    },
    async restore(cleanup: () => void | Promise<void> = () => {}) {
      const conflicts = new Set(rejected);
      for (const [path, original] of originals) {
        if (rejected.has(path)) continue;
        let current: string | undefined;
        try {
          current = existsSync(path) ? readFileSync(path, 'utf8') : undefined;
          if (owned.has(path) && current === owned.get(path)) {
            if (original === undefined) {
              unlinkSync(path);
            } else {
              writeFileSync(path, original);
            }
          } else if (current !== original) {
            conflicts.add(path);
            revoke(path, current);
          }
        } catch (error) {
          conflicts.add(path);
          try {
            revoke(path, current, error);
          } catch {
            // Preserve revocation on evidence storage failure.
          }
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
