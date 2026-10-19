import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createMediaAcceptanceRun} from '../../../scripts/media-optimization-acceptance.mjs';
import {assertCanonicalSnapshot} from '../../../scripts/composition-c-snapshot.mjs';
const baseline=JSON.parse(readFileSync(new URL('./final-fix-canonical-before.json',import.meta.url),'utf8'));
assertCanonicalSnapshot(baseline);
const run=createMediaAcceptanceRun({expected:()=>baseline});
writeFileSync(new URL('./final-fix-browser-directory.txt',import.meta.url),run.directory+'\n');
try{
 await run.command(['node_modules/@playwright/test/cli.js','test','e2e/media-optimization.spec.ts','--grep','scoped static WebP','--reporter=list','--output='+join(run.directory,'browser-results')],{env:{PLAYWRIGHT_BROWSERS_PATH:resolve('.generated/browsers')}});
 await run.build();
}finally{run.finish();}
