import fs from 'node:fs';import {resolve,dirname,parse,join,relative,isAbsolute} from 'node:path';
const key=path=>process.platform==='win32'?path.toLowerCase():path;
function regularAncestors(path){
 const absolute=resolve(path);let cursor=parse(absolute).root;
 for(const part of absolute.slice(cursor.length).split(/[\\/]/).filter(Boolean)){cursor=join(cursor,part);const stat=fs.lstatSync(cursor);if(!stat.isDirectory()||stat.isSymbolicLink())throw Error('Unsafe linked directory: '+cursor);}
 return fs.realpathSync(absolute);
}
export function inspectDestination(source,target){
 const sourcePath=regularAncestors(source),requested=resolve(target),parent=regularAncestors(dirname(requested));
 const destination=join(parent,parse(requested).base),a=key(sourcePath),b=key(destination);
 for(const [ancestor,child] of [[a,b],[b,a]]){const rel=relative(ancestor,child);if(rel===''||(!rel.startsWith('..')&&!isAbsolute(rel)))throw Error('Source and destination cannot overlap');}
 let identity;const existedEmpty=fs.existsSync(destination);
 if(existedEmpty){regularAncestors(destination);identity=fs.lstatSync(destination);if(fs.readdirSync(destination).length)throw Error('Destination must be empty; existing contents are preserved');}
 const parentIdentity=fs.lstatSync(parent);
 return {source:sourcePath,target:destination,existedEmpty,assertOwned(){
  regularAncestors(parent);const currentParent=fs.lstatSync(parent);if(currentParent.ino!==parentIdentity.ino||currentParent.dev!==parentIdentity.dev)throw Error('Destination parent changed');
  if(identity){regularAncestors(destination);const current=fs.lstatSync(destination);if(current.ino!==identity.ino||current.dev!==identity.dev)throw Error('Destination ownership changed');}
  else if(fs.existsSync(destination))throw Error('Destination was created by another owner');
 },claim(){this.assertOwned();if(!existedEmpty)fs.mkdirSync(destination);identity=fs.lstatSync(destination);return identity;}};
}
