import {createServer} from 'node:http';
import {mkdirSync,mkdtempSync,copyFileSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {resolve,join,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {assertPortsFree} from './ports.mjs';
import {runOwnedCommand} from './owned-command.mjs';
export function probePorts(env=process.env){const ports={};for(const [key,name,fallback] of [['site','SITE_PORT',4434],['tina','TINA_PORT',4024],['datalayer','TINA_DATALAYER_PORT',9024]]){const value=env[name]??String(fallback);if(!/^\d+$/.test(value)||+value<1||+value>65535)throw Error(name+' must be an integer from 1 to 65535');ports[key]=+value;}if(new Set(Object.values(ports)).size!==3)throw Error('Probe ports must be distinct');return ports;}
export async function runProbe(){
 const ports=probePorts();await assertPortsFree(ports);
 const parent=resolve('.generated/composition-probe');mkdirSync(parent,{recursive:true});const root=mkdtempSync(join(parent,'run-'));for(const folder of ['tina','content/pages','public','evidence'])mkdirSync(join(root,folder),{recursive:true});
 copyFileSync('tests/fixtures/composition-probe/tina/config.ts',join(root,'tina/config.ts'));
 const hooks=[];const proof={root,ports,hooks,ownedCommand:null,stopped:false};
 const server=createServer(async(req,res)=>{try{
  if(req.url==='/__probe/before-submit'&&req.method==='POST'){let body='';for await(const chunk of req)body+=chunk;const context=JSON.parse(body);const path=join(root,'content/pages/probe.json');hooks.push({...context,priorExists:existsSync(path),priorBytes:existsSync(path)?readFileSync(path,'utf8'):null});writeFileSync(join(root,'evidence/hooks.json'),JSON.stringify(hooks,null,2));res.end('ok');return;}
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=resolve(root,'public','.'+pathname);if(!file.startsWith(resolve(root,'public')+sep)){res.writeHead(403).end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(readFileSync(file));
 }catch{res.writeHead(404).end();}});
 await new Promise((ok,fail)=>{server.once('error',fail);server.listen(ports.site,'127.0.0.1',ok);});
 console.log('Isolated composition fixture '+root);
 try{proof.ownedCommand=await runOwnedCommand(process.execPath,[resolve('node_modules/@tinacms/cli/bin/tinacms'),'dev','--rootPath',root,'--port',String(ports.tina),'--datalayer-port',String(ports.datalayer),'--noTelemetry','--command','node node_modules/@playwright/test/cli.js test --config playwright.composition-probe.config.ts'],{timeoutMs:240000,env:{...process.env,COMPOSITION_PROBE_ROOT:root,E2E_BASE_URL:'http://127.0.0.1:'+ports.site,PLAYWRIGHT_BROWSERS_PATH:resolve('.generated/browsers')},onOutput:text=>process.stdout.write(text)});}
 finally{await new Promise(ok=>server.close(ok));await assertPortsFree(ports);proof.stopped=true;writeFileSync(join(root,'evidence/runner.json'),JSON.stringify(proof,null,2));console.log('Composition proof '+join(root,'evidence'));}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await runProbe();
