import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {canonicalSnapshot,assertCanonicalSnapshot} from '../../../scripts/composition-c-snapshot.mjs';
const file=new URL('./canonical-before.json',import.meta.url),bytes=readFileSync(file),before=JSON.parse(bytes);
assertCanonicalSnapshot(before);
writeFileSync(new URL('./task-5-canonical-audit.json',import.meta.url),JSON.stringify({baselineFileSha256:createHash('sha256').update(bytes).digest('hex'),baselineEntries:Object.keys(before).length,unchanged:true,before,after:canonicalSnapshot()},null,2)+'\n');
console.log('Canonical baseline matched: '+Object.keys(before).length+' entries');
