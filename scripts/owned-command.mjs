import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execute = promisify(execFile);

export async function runOwnedCommand(executable, args, {
  timeoutMs = 120000,
  cwd = process.cwd(),
  env = process.env,
  onOutput = () => {},
  onStart = () => {},
} = {}) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw Error('Command timeout must be positive');
  }
  const child = spawn(executable, args, {
    cwd, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
    detached: process.platform !== 'win32',
  });
  child.once('spawn', () => onStart(child.pid));
  let stdout = '', stderr = '', timedOut = false, cleanup = Promise.resolve();
  const collect = (stream, channel) => stream.on('data', chunk => {
    const text = chunk.toString();
    if (channel === 'stderr') stderr = (stderr + text).slice(-65536);
    else stdout = (stdout + text).slice(-65536);
    onOutput(text, channel);
  });
  collect(child.stdout, 'stdout');
  collect(child.stderr, 'stderr');
  const timer = setTimeout(() => {
    timedOut = true;
    cleanup = (async () => {
      if (!child.pid || child.exitCode !== null) return;
      if (process.platform === 'win32') {
        await execute('taskkill', ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true });
      } else {
        try { process.kill(-child.pid, 'SIGTERM'); }
        catch (error) { if (error.code !== 'ESRCH') throw error; }
      }
    })();
  }, timeoutMs);
  return new Promise((resolve, reject) => {
    child.once('error', error => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('close', async code => {
      clearTimeout(timer);
      try {
        await cleanup;
        if (timedOut) throw Error('Command timed out after ' + timeoutMs + 'ms: ' + args.join(' '));
        if (code !== 0) throw Error('Command exit ' + code + ': ' + args.join(' '));
        resolve({ stdout, stderr, pid: child.pid });
      } catch (error) { reject(error); }
    });
  });
}
