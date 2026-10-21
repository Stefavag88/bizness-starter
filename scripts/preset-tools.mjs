import {readFileSync,lstatSync} from 'node:fs';
import {join} from 'node:path';
// No imports into source-only tools: generated clients use this same configuration.
export function presetToolsEnabled(root,environment){
 if(environment!=='local')return false;
 try{
  const marker=join(root,'.starter-tools.json');if(!lstatSync(marker).isFile()||lstatSync(marker).isSymbolicLink())return false;
  const value=JSON.parse(readFileSync(marker,'utf8'));if(value.kind!=='starter-source'||value.version!==1)return false;
  return ['Gallery.astro','Preview.astro'].every(file=>{const stat=lstatSync(join(root,'apps/site/src/presets',file));return stat.isFile()&&!stat.isSymbolicLink();});
 }catch{return false;}
}
