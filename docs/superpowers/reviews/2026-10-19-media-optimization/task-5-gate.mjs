import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createMediaAcceptanceRun} from '../../../scripts/media-optimization-acceptance.mjs';
import {assertCanonicalSnapshot} from '../../../scripts/composition-c-snapshot.mjs';
const expected=JSON.parse(readFileSync(new URL('./canonical-before.json',import.meta.url),'utf8'));
assertCanonicalSnapshot(expected);
const run=createMediaAcceptanceRun({expected:()=>expected});
try{await run.command([resolve(process.env.APPDATA,'npm/node_modules/pnpm/bin/pnpm.cjs'),process.argv[2]]);}finally{run.finish();}
