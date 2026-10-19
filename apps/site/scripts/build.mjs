import {build} from 'astro';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {endMediaSession} from '../../../packages/media/session.mjs';
const projectRoot=fileURLToPath(new URL('../../../',import.meta.url));
const siteRoot=new URL('../',import.meta.url);
/** Astro has no general build-error hook. This entry owns final cleanup. */
export async function buildSite(inlineConfig={},root=projectRoot,options={}){
 try {await build({root:siteRoot,...inlineConfig},options);}
 finally {await endMediaSession(root);}
}
// Public CLI compatibility for the pinned Astro build command. Unknown arguments
// fail explicitly; no option is silently discarded by the owned entry point.
export function parseBuildArgs(args){
 const config={},options={};let help=false;
 const strings=new Set(['root','config','mode','site','base','outDir']);
 const booleans=new Set(['force','devOutput','verbose','silent','json','help','h']);
 for(let i=0;i<args.length;i++){
  const match=/^--?([^=]+)(?:=(.*))?$/.exec(args[i]);if(!match)throw new Error(`Unsupported build argument: ${args[i]}`);
  const [,name,inline]=match;let value=inline;
  if(booleans.has(name)){
   const enabled=value!=='false';
   if(name==='devOutput')options.devOutput=enabled;
   else if(name==='force')config.force=enabled;
   else if(name==='verbose'&&enabled)config.logLevel='debug';
   else if(name==='silent'&&enabled)config.logLevel='silent';
   else if(name==='json'&&enabled)config.logger={entrypoint:'astro/logger/json'};
   else if(name==='help'||name==='h')help=enabled;
  }else if(strings.has(name)||['port','host','open','allowedHosts'].includes(name)){
   if(value===undefined&&args[i+1]&&!args[i+1].startsWith('-'))value=args[++i];
   if(strings.has(name)){if(!value)throw new Error(`Build --${name} requires a value`);config[name==='config'?'configFile':name]=value;}
   else {config.server??={};if(name==='port'){const port=Number(value);if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid build port');config.server.port=port;}else config.server[name]=value===undefined||value==='true'?true:value==='false'?false:name==='allowedHosts'?value.split(','):value;}
  }else throw new Error(`Unsupported build argument: ${args[i]}`);
 }
 return {config,options,help};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const {config,options,help}=parseBuildArgs(process.argv.slice(2));
 if(help)console.log('Site build: --root --config --outDir --mode --site --base --force --devOutput --verbose --silent --json --port --host --open --allowedHosts');
 else await buildSite(config,projectRoot,options);
}
