import { createServer } from 'node:net';
import { describe, expect, it } from 'vitest';
import { resolvePorts, assertPortsFree } from '../scripts/ports.mjs';
describe('isolated local ports', () => {
 it('uses the documented defaults', () => { expect(resolvePorts({})).toEqual({site:4330,worker:8790,tina:4010,datalayer:9010}); });
 it('honors all overrides', () => { expect(resolvePorts({SITE_PORT:'5330',WORKER_PORT:'9790',TINA_PORT:'5010',TINA_DATALAYER_PORT:'10010'})).toEqual({site:5330,worker:9790,tina:5010,datalayer:10010}); });
 it.each(['0','65536','abc','4.5','4330x',''])('rejects invalid override %s', (value) => { expect(() => resolvePorts({SITE_PORT:value})).toThrow(/SITE_PORT/); });
 it('rejects overlapping configured ports', () => { expect(() => resolvePorts({SITE_PORT:'8790'})).toThrow(/distinct/); });
 it('reports an occupied port without closing its owner', async () => { const server=createServer(); await new Promise<void>(r=>server.listen(0,'127.0.0.1',r)); const address=server.address(); if (!address || typeof address==='string') throw Error('Missing address'); try { await expect(assertPortsFree({site:address.port})).rejects.toThrow(/site.*in use/); expect(server.listening).toBe(true); } finally { await new Promise<void>((r,j)=>server.close(e=>e?j(e):r())); } });
});
