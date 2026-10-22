import {readFileSync,writeFileSync,lstatSync,realpathSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseProject} from '../../packages/config/project.mjs';
import {deploymentIdentity,identityText} from '../../packages/config/deployment-identity.mjs';
import {createWorkerConfig} from '../worker-config.mjs';
import {productionIssues} from './production.mjs';
import {sha256,canonical,regularTree,regularBytes} from './release-inputs.mjs';
export function releaseWorkerConfig(target){
 const config=createWorkerConfig(target.project,{siteUrl:'',workerUrl:'',tinaUrl:''},target);
 config.main='worker/index.js';config.assets.directory='assets';config.d1_databases[0].migrations_dir='migrations';return config;
}
const checks=['typecheck','publicBuild','workerBundle','localMigrations','packagedDryRun'];
function inspect(root,metadata,expected){
 if(lstatSync(resolve(root)).isSymbolicLink())throw Error('Release root links are unsupported');root=realpathSync(resolve(root));
 const parse=path=>JSON.parse(regularBytes(root,path));
 const project=parseProject(parse('project.json'));
 if(project.environment!=='production'||metadata.format!==1||metadata.target!=='production'||metadata.application!==project.name||metadata.databaseId!==project.infrastructure.databaseId||!/^([a-f0-9]{32})$/.test(metadata.accountId)||!/^([a-f0-9]{64})$/.test(metadata.inputDigest)||!/^([a-f0-9]{64})$/.test(metadata.targetDigest))throw Error('Invalid release target metadata');
 const target={application:project.name,accountId:metadata.accountId,project};
 if(expected&&(canonical(expected.project)!==canonical(project)||expected.accountId!==target.accountId||expected.application!==target.application))throw Error('Release target/account mismatch');
 if(checks.some(key=>metadata.checks?.[key]!==true)||metadata.cms!=='not_built'||!metadata.tools?.node||metadata.tools.pnpm!=='10.13.1'||metadata.tools.wrangler!=='4.148.0')throw Error('Missing release checks or tool versions');
 const identity=deploymentIdentity(project),text=identityText(identity);
 if(canonical(parse('identity.json'))!==canonical(identity))throw Error('Release identity mismatch');
 if(canonical(parse('wrangler.json'))!==canonical(releaseWorkerConfig(target)))throw Error('Release config/path mismatch');
 const all=regularTree(root);delete all['release.json'];
 for(const path of Object.keys(all)){
  if(!['project.json','identity.json','wrangler.json'].includes(path)&&!path.startsWith('assets/')&&!path.startsWith('worker/')&&!/^migrations\/[0-9]{4}_[a-z0-9_]+\.sql$/.test(path))throw Error('Unexpected release inventory path: '+path);
  if(/^assets\/(cms|templates|design-system)(\/|$)/.test(path)||path.split('/').some(p=>p.startsWith('.')))throw Error('Local/hidden output forbidden in release: '+path);
 }
 if(!Object.keys(all).some(p=>p.startsWith('migrations/')))throw Error('Missing release migrations');
 const marker=Buffer.from(text).toString('base64');
 if(!regularBytes(root,'worker/index.js').toString().includes(marker))throw Error('Compiled Worker identity marker mismatch');
 let pages=0;
 for(const path of Object.keys(all).filter(p=>/^assets\/.*\.html$/.test(p)&&!p.endsWith('/404.html')&&!p.endsWith('/404/index.html'))){
  const html=regularBytes(root,path).toString();
  if(path==='assets/index.html'){
   if(!html.includes('<meta http-equiv="refresh" content="2;url=/'+project.locale+'">')||!html.includes('<link rel="canonical" href="'+new URL('/'+project.locale,project.siteUrl).href+'">'))throw Error('Root redirect identity mismatch');
   continue;
  }
  // Astro escapes JSON quotes in attributes. Every application HTML page must agree.
  const match=html.match(/<meta\s+name="starter-deployment"\s+content="([^"]*)"/);
  if(!match||match[1].replaceAll('&quot;','"').replaceAll('&#34;','"').replaceAll('&amp;','&')!==text)throw Error('Frontend identity marker mismatch: '+path);pages++;
 }
 if(!pages)throw Error('Missing public HTML pages');
 return {files:all,issues:productionIssues(target),project};
}
export function sealReleaseArtifact(root,metadata){
 const inspected=inspect(root,metadata);
 const manifest={...metadata,status:'blocked',deployable:false,issues:inspected.issues,files:inspected.files};
 manifest.releaseId=sha256(canonical(manifest));
 writeFileSync(join(root,'release.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 return verifyReleaseArtifact(root);
}
export function verifyReleaseArtifact(root,expected){
 root=resolve(root);const bytes=regularBytes(root,'release.json'),manifest=JSON.parse(bytes),{releaseId,...unsigned}=manifest;
 if(releaseId!==sha256(canonical(unsigned)))throw Error('Release manifest integrity checksum mismatch');
 const actual=regularTree(root);delete actual['release.json'];
 if(canonical(actual)!==canonical(manifest.files))throw Error('Release inventory/hash integrity mismatch (extra, missing or modified file)');
 const inspected=inspect(root,manifest,expected);
 if(canonical(inspected.files)!==canonical(manifest.files))throw Error('Release inventory/hash integrity mismatch (extra, missing or modified file)');
 if(manifest.status!=='blocked'||manifest.deployable!==false||canonical(manifest.issues)!==canonical(inspected.issues))throw Error('Release readiness must remain blocked');
 return manifest;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 try{const args=process.argv.slice(2).filter((v,i)=>!(i===0&&v==='--'));if(args.length!==2||args[0]!=='--artifact')throw Error('Usage: release:verify --artifact DIR');const manifest=verifyReleaseArtifact(args[1]);console.log(JSON.stringify({artifact:resolve(args[1]),releaseId:manifest.releaseId,integrity:'verified',status:manifest.status,issues:manifest.issues},null,2));}catch(error){console.error(error.message);process.exitCode=1;}
}
