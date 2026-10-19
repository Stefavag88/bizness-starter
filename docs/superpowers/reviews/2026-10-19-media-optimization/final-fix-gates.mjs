import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createMediaAcceptanceRun} from '../../../scripts/media-optimization-acceptance.mjs';
import {assertCanonicalSnapshot} from '../../../scripts/composition-c-snapshot.mjs';
const baseline=JSON.parse(readFileSync(new URL('./final-fix-canonical-before.json',import.meta.url),'utf8'));
assertCanonicalSnapshot(baseline);
const run=createMediaAcceptanceRun({expected:()=>baseline});
writeFileSync(new URL('./final-fix-gate-directory.txt',import.meta.url),run.directory+'\n');
try{for(const gate of ['check','test'])await run.command([resolve(process.env.APPDATA,'npm/node_modules/pnpm/bin/pnpm.cjs'),gate]);}finally{run.finish();}
