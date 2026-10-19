import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
export function canonicalSnapshot(root=process.cwd()) {
 const walk=path=>existsSync(path)?readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(path,e.name)):[join(path,e.name)]):[];
 return Object.fromEntries([join(root,'project.json'),...walk(join(root,'content')),...walk(join(root,'apps/site/public/uploads'))].sort().map(path=>[relative(root,path).replaceAll('\\','/'),createHash('sha256').update(readFileSync(path)).digest('hex')]));
}
export function assertCanonicalSnapshot(expected,root=process.cwd()){if(!isDeepStrictEqual(canonicalSnapshot(root),expected))throw Error('Full canonical project/content/uploads snapshot conflict; regeneration refused');}
