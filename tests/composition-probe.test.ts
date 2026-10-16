import {expect,it} from 'vitest';
import {createServer} from 'node:net';
import {createServer as createHttpServer} from 'node:http';
import {mkdtempSync,mkdirSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve,sep,basename} from 'node:path';
import {probePorts,runProbeCommand} from '../scripts/probe-composition.mjs';
import {assertPortsFree} from '../scripts/ports.mjs';
it('uses isolated probe defaults and normal port overrides',()=>{expect(probePorts({})).toEqual({site:4434,tina:4024,datalayer:9024});expect(probePorts({SITE_PORT:'5434',TINA_PORT:'5024',TINA_DATALAYER_PORT:'10024'})).toEqual({site:5434,tina:5024,datalayer:10024});});
it.each([{SITE_PORT:'0'},{TINA_PORT:'oops'},{TINA_DATALAYER_PORT:'65536'},{SITE_PORT:'4024'}])('rejects invalid or overlapping probe ports',env=>expect(()=>probePorts(env)).toThrow());
it('refuses an occupied probe port without stopping its owner',async()=>{const server=createServer();await new Promise<void>(ok=>server.listen(0,'127.0.0.1',ok));try{const address=server.address() as {port:number};await expect(assertPortsFree({site:address.port})).rejects.toThrow('in use');expect(server.listening).toBe(true);}finally{await new Promise<void>(ok=>server.close(()=>ok()));}});

it('retains PID and bounded streams when a real owned command exits nonzero', async () => {
  const f = await runnerFixture();
  try {
    await expect(runProbeCommand({
      ...f,
      args: ['-e', `process.stdout.write('x'.repeat(70000)+'COMMAND_MARKER');console.error('COMMAND_STDERR');process.exitCode=7;`],
    })).rejects.toThrow('Command exit 7');
    const proof = JSON.parse(readFileSync(join(f.root, 'evidence/runner.json'), 'utf8'));
    expect(proof.ownedCommand.pid).toBeGreaterThan(0);
    expect(proof.ownedCommand.stdout).toContain('COMMAND_MARKER');
    expect(proof.ownedCommand.stdout.length).toBeLessThanOrEqual(65536);
    expect(proof.ownedCommand.stderr).toContain('COMMAND_STDERR');
    expect(proof.error).toContain('Command exit 7');
    expect(proof.stopped).toBe(true);
  } finally {
    await cleanupRunner(f);
  }
});
it('always writes proof after a real teardown port conflict and preserves the command error', async () => {
  const f = await runnerFixture();
  const occupied = createServer();
  try {
    await expect(runProbeCommand({
      ...f,
      args: ['-e', `console.log('TEARDOWN_MARKER');process.exitCode=7;`],
      checkPorts: async (ports: Record<string, number>) => {
        await new Promise<void>(ok => occupied.listen(ports.site, '127.0.0.1', ok));
        await assertPortsFree(ports);
      },
    })).rejects.toThrow('Command exit 7');
    const proof = JSON.parse(readFileSync(join(f.root, 'evidence/runner.json'), 'utf8'));
    expect(proof.ownedCommand.pid).toBeGreaterThan(0);
    expect(proof.ownedCommand.stdout).toContain('TEARDOWN_MARKER');
    expect(proof.error).toContain('Command exit 7');
    expect(proof.teardownErrors.join(' ')).toContain('in use');
    expect(proof.stopped).toBe(false);
    expect(occupied.listening).toBe(true);
  } finally {
    if (occupied.listening) await new Promise<void>(ok => occupied.close(() => ok()));
    await cleanupRunner(f);
  }
});
async function runnerFixture() {
  const root = mkdtempSync(join(tmpdir(), 'composition-runner-'));
  mkdirSync(join(root, 'evidence'));
  const server = createHttpServer();
  await new Promise<void>(ok => server.listen(0, '127.0.0.1', ok));
  return {
    root, server, onOutput: () => {},
    ports: { site: (server.address() as {port: number}).port },
  };
}
async function cleanupRunner(f: Awaited<ReturnType<typeof runnerFixture>>) {
  if (f.server.listening) await new Promise<void>(ok => f.server.close(() => ok()));
  if (!resolve(f.root).startsWith(resolve(tmpdir()) + sep) ||
      !basename(f.root).startsWith('composition-runner-')) {
    throw Error('Unsafe runner fixture cleanup');
  }
  rmSync(f.root, { recursive: true, force: true });
}
