import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { resolvePorts, assertPortsFree } from './ports.mjs';
if (process.argv.includes('--cms') || process.argv.includes('--cms-build')) {
  console.error('Tina collections arrive in Task 3. The editor is not available yet.');
  process.exitCode = 1;
} else {
  try {
    const ports = resolvePorts();
    await assertPortsFree({site: ports.site, worker: ports.worker});
    await import('./configure.mjs');
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
    start('worker', [resolve('node_modules/wrangler/bin/wrangler.js'), 'dev', '--local', '--ip', '127.0.0.1', '--port', String(ports.worker), '--inspector-port', '0', '--config', resolve('wrangler.generated.json')], process.cwd());
    start('site', [resolve('apps/site/node_modules/astro/bin/astro.mjs'), 'dev', '--host', '127.0.0.1', '--port', String(ports.site)], resolve('apps/site'));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
