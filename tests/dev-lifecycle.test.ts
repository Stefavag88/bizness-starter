import { spawn } from 'node:child_process';
import { createServer } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { expect, it } from 'vitest';
async function freePort():Promise<number> {const server=createServer();await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const a=server.address();if(!a||typeof a==='string')throw Error('No port');await new Promise<void>(r=>server.close(()=>r()));return a.port;}
it('serves overridden ports then removes its own child tree on Ctrl+C input', async () => {
 const ports=new Set<number>();while(ports.size<4)ports.add(await freePort());const [site,worker,tina,datalayer]=[...ports];
 const child=spawn(process.execPath,['scripts/dev.mjs'],{cwd:process.cwd(),env:{...process.env,SITE_PORT:String(site),WORKER_PORT:String(worker),TINA_PORT:String(tina),TINA_DATALAYER_PORT:String(datalayer)},stdio:['pipe','pipe','pipe']});
 let output='';child.stdout.on('data',d=>output+=d);child.stderr.on('data',d=>output+=d);
 const exited=new Promise<number|null>(r=>child.once('exit',r));
 try {
  const deadline=Date.now()+45000;let ready=false;
  while(Date.now()<deadline){try{const r=await fetch(`http://127.0.0.1:${site}/api/health`,{signal:AbortSignal.timeout(500)});if(r.ok){ready=true;break;}}catch{}await delay(150);}
  expect(ready,output).toBe(true);
  expect((await fetch(`http://127.0.0.1:${worker}/api/health`)).status).toBe(200);
  child.stdin.write(Buffer.from([3]));
  expect(await Promise.race([exited,delay(8000).then(()=> 'timeout')]),output).toBe(0);
  const pids=[...output.matchAll(/Owned (?:site|worker|content) process (\d+)/g)].map(m=>Number(m[1]));expect(pids).toHaveLength(3);
  for(const pid of pids) expect(()=>process.kill(pid,0)).toThrow();
  await expect(fetch(`http://127.0.0.1:${site}/`,{signal:AbortSignal.timeout(500)})).rejects.toThrow();
  await expect(fetch(`http://127.0.0.1:${worker}/api/health`,{signal:AbortSignal.timeout(500)})).rejects.toThrow();
 } finally {if(child.exitCode===null){if(process.platform==='win32'){const killer=spawn('taskkill',['/PID',String(child.pid),'/T','/F']);await new Promise(r=>killer.on('exit',r));}else child.kill('SIGTERM');}}
},60000);
