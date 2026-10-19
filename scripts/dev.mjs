import { spawn, execFile } from 'node:child_process';
import {promisify} from 'node:util';
import { resolve } from 'node:path';
import { resolvePorts, assertPortsFree } from './ports.mjs';
const cms=process.argv.includes('--cms');
const cmsBuild=process.argv.includes('--cms-build');
{
  try {
    const ports = resolvePorts();
    await assertPortsFree(cmsBuild?{tina:ports.tina,datalayer:ports.datalayer}:cms?ports:{site: ports.site, worker: ports.worker});
    await import('./configure.mjs');
    if(!cmsBuild){
      const prepare=promisify(execFile);
      const env={...process.env,XDG_CONFIG_HOME:resolve('.wrangler/config'),WRANGLER_LOG_PATH:resolve('.wrangler/logs'),WRANGLER_SEND_METRICS:'false',ASTRO_TELEMETRY_DISABLED:'1'};
      await prepare(process.execPath,[resolve('apps/site/scripts/build.mjs')],{cwd:resolve('apps/site'),env});
      const migrated=await prepare(process.execPath,[resolve('node_modules/wrangler/bin/wrangler.js'),'d1','migrations','apply','DB','--local','--config',resolve('wrangler.generated.json')],{env});
      console.log(migrated.stdout);
    }
    const children = [];
    let stopping = false;
    const stop = async (code = 0) => {
      if (stopping) return;
      stopping = true;
      process.exitCode = code;
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.destroy();
      console.log("Stopping owned development processes");
      await Promise.all(children.map(child => new Promise(resolveStop => {
        if (!child.pid) return resolveStop();
        if (process.platform === 'win32') {
          // These exact PIDs were created by this launcher; never select by process name or port.
          const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {stdio: 'ignore', windowsHide: true});
          killer.once('error', resolveStop);
          killer.once('exit', resolveStop);
        } else {
          try { process.kill(-child.pid, 'SIGTERM'); } catch {}
          resolveStop();
        }
      })));
    };
    const start = (name, args, cwd) => {
      const child = spawn(process.execPath, args, {
        cwd, stdio: ['ignore','inherit','inherit'], detached: process.platform !== 'win32',
        env: {...process.env, XDG_CONFIG_HOME: resolve('.wrangler/config'), WRANGLER_LOG_PATH: resolve('.wrangler/logs'), WRANGLER_SEND_METRICS: 'false', ASTRO_TELEMETRY_DISABLED: '1'},
      });
      children.push(child);
      console.log(`Owned ${name} process ${child.pid}`);
      child.on('error', error => { console.error(error.message); void stop(1); });
      child.on('exit', code => { if (!stopping) void stop(code ?? 1); });
    };
    process.on('SIGINT', () => void stop());
    process.on('SIGTERM', () => void stop());
    // Keep terminal input with the launcher so competing CLIs cannot consume Ctrl+C.
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.on('data', data => { if (data.includes(3)) void stop(); });
    process.stdin.resume();
    if(!cmsBuild)start('content', [resolve('scripts/watch-content.mjs')], process.cwd());
    if(cms||cmsBuild)start('tina',[resolve('node_modules/@tinacms/cli/bin/tinacms'),cmsBuild?'build':'dev',...(cmsBuild?['--local','--skip-cloud-checks','--skip-indexing']:[]),'--port',String(ports.tina),'--datalayer-port',String(ports.datalayer),'--noTelemetry'],process.cwd());
    if(!cmsBuild)start('worker', [resolve('node_modules/wrangler/bin/wrangler.js'), 'dev', '--local', '--ip', '127.0.0.1', '--port', String(ports.worker), '--inspector-port', '0', '--config', resolve('wrangler.generated.json')], process.cwd());
    if(!cmsBuild)start('site', [resolve('apps/site/node_modules/astro/bin/astro.mjs'), 'dev', '--host', '127.0.0.1', '--port', String(ports.site)], resolve('apps/site'));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
