import {lstatSync,readFileSync,realpathSync} from 'node:fs';import {join,resolve} from 'node:path';
export function readPresetMedia(assetRoot,name){
 if(!['abstract-landscape.png','abstract-portrait.png'].includes(name))throw Error('Not a reviewed preset media file');
 let cursor=resolve(assetRoot);if(lstatSync(cursor).isSymbolicLink())throw Error('Preset media root refuses links');cursor=realpathSync(cursor);
 for(const part of ['apps','site','public','uploads','starter-samples',name]){cursor=join(cursor,part);if(lstatSync(cursor).isSymbolicLink())throw Error('Preset media refuses links');}
 if(!lstatSync(cursor).isFile())throw Error('Expected a regular preset media file');return new Uint8Array(readFileSync(cursor));
}
