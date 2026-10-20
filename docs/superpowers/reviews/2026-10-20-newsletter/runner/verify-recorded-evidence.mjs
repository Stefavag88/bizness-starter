import {readFileSync} from 'node:fs';import assert from 'node:assert/strict';
const root='docs/superpowers/reviews/2026-10-20-newsletter/runner';const read=path=>JSON.parse(readFileSync(root+'/'+path,'utf8'));
const gates=read('gates-final.json');assert.equal(gates.length,7);assert(gates.every(row=>row.exitCode===0));
for(const run of ['full','preferences']){assert.equal(read(run+'/command.json').exitCode,0);assert.deepEqual(read(run+'/inputs.json'),read(run+'/inputs-after.json'));}
assert.equal(read('full/native/summary.json').nativeSaves,5);assert(read('full/public/matrix.json').some(row=>row.uniform202));assert(read('preferences/browser/matrix.json').some(row=>row.blockedStorageManualForm));assert.equal(read('default-profile-browser.json').newsletterControllerRequested,false);assert.equal(read('closeout-runtime.json').rows.length,6);console.log('Seven gates, two complementary acceptance runs, exact inventories and restored runtime evidence verified');
