import assert from 'node:assert/strict';import {existsSync,readdirSync,lstatSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {join,resolve,relative} from 'node:path';import {pathToFileURL} from 'node:url';import {createHash} from 'node:crypto';
import {withRehearsalStack} from './rehearsal-stack.mjs';
import {verifyShowcaseBuilds} from './verify-showcase-builds.mjs';import {runOwnedCommand} from './owned-command.mjs';import {assertPortsFree,resolvePorts} from './ports.mjs';
function files(root){return existsSync(root)?readdirSync(root).flatMap(name=>{const path=join(root,name),stat=lstatSync(path);if(stat.isSymbolicLink())throw Error('Artifact inventory refuses links');return stat.isDirectory()?files(path):[path];}):[];}
export function presetAssetInventory(dist){return files(dist).filter(path=>/\.(js|css)$/.test(path)).map(path=>{const bytes=readFileSync(path);return {path:relative(dist,path).replaceAll('\\','/'),sha256:createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,preset:/(?:\.preset-(?:gallery|card|grid|choices)|\.template-preview-notice|data-copy-command)/.test(bytes.toString())};});}
export function assertPresetArtifacts(dist,local){
 assert.equal(existsSync(join(dist,'templates/index.html')),local,'Gallery route presence');
 const assets=presetAssetInventory(dist);assert.equal(assets.some(a=>a.preset),local,'Dedicated preset asset presence');
 if(!local)for(const path of files(dist).filter(p=>/\.(html|xml|json)$/.test(p)))assert.ok(!readFileSync(path,'utf8').includes('/templates/'),'Preview URL leaked: '+path);
 return assets;
}
export async function verifyPresets({root=process.cwd()}={}){
 root=resolve(root);await assertPortsFree(resolvePorts());const directory=join(root,'.generated/presets-artifacts');mkdirSync(directory,{recursive:true});
 const inventories=[];
 const build=async(environment='local')=>{
  for(const [args,cwd] of [[['scripts/configure.mjs'],root],[[join(root,'apps/site/scripts/build.mjs')],join(root,'apps/site')]])await runOwnedCommand(process.execPath,args,{cwd,timeoutMs:180000,onOutput:text=>process.stdout.write(text)});
  const assets=assertPresetArtifacts(join(root,'apps/site/dist'),environment==='local');inventories.push({environment,assets});writeFileSync(join(directory,'assets.json'),JSON.stringify(inventories,null,2));
 };
 await verifyShowcaseBuilds({path:join(root,'project.json'),backupRoot:directory,run:build,refresh:()=>build('local')});
 await withRehearsalStack(root,{log:join(directory,'launcher.log')},()=>runOwnedCommand(process.execPath,[join(root,'node_modules/@playwright/test/cli.js'),'test','e2e/presets.spec.ts'],{cwd:root,timeoutMs:180000,onOutput:text=>process.stdout.write(text)}));
 console.log('Preset artifact and browser evidence: '+directory);
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await verifyPresets();
