import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import type {createCmsSources} from './cms-source-ownership';
type Sources=ReturnType<typeof createCmsSources>;
export function createCmsEvidence(directory='.generated/evidence'){
 mkdirSync(directory,{recursive:true});
 return {async captureNative(sources:Sources,...args:Parameters<Sources['captureNative']>){
  const [path,mutation]=args;
  // Claim the complete native record before optional evidence I/O can throw.
  await sources.captureNative(...args);
  writeFileSync(join(directory,'last-native-mutation.json'),JSON.stringify({mutation,saved:JSON.parse(readFileSync(path,'utf8'))},null,2));
 }};
}
