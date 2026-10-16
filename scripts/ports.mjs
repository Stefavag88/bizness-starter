import { createServer } from 'node:net';
export function resolvePorts(env = process.env) {
  const ports = {};
  for (const [key, name, fallback] of [['site','SITE_PORT',4330],['worker','WORKER_PORT',8790],['tina','TINA_PORT',4010],['datalayer','TINA_DATALAYER_PORT',9010]]) {
    const value = env[name] ?? String(fallback);
    if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535) throw Error(`${name} must be an integer from 1 to 65535`);
    ports[key] = Number(value);
  }
  if (new Set(Object.values(ports)).size !== 4) throw Error('SITE_PORT, WORKER_PORT, TINA_PORT and TINA_DATALAYER_PORT must be distinct');
  return ports;
}
export async function assertPortsFree(ports) {
  for (const [name, port] of Object.entries(ports)) await new Promise((resolve,reject) => {
    const server = createServer();
    server.once('error', error => reject(Error(`${name} port ${port} is in use or unavailable (${error.code}); choose a port override.`, {cause:error})));
    server.listen(port,'127.0.0.1', () => server.close(error => error ? reject(error) : resolve()));
  });
}
