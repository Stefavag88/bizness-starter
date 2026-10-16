import {expect,it} from 'vitest';
import {createServer} from 'node:net';
import {probePorts} from '../scripts/probe-composition.mjs';
import {assertPortsFree} from '../scripts/ports.mjs';
it('uses isolated probe defaults and normal port overrides',()=>{expect(probePorts({})).toEqual({site:4434,tina:4024,datalayer:9024});expect(probePorts({SITE_PORT:'5434',TINA_PORT:'5024',TINA_DATALAYER_PORT:'10024'})).toEqual({site:5434,tina:5024,datalayer:10024});});
it.each([{SITE_PORT:'0'},{TINA_PORT:'oops'},{TINA_DATALAYER_PORT:'65536'},{SITE_PORT:'4024'}])('rejects invalid or overlapping probe ports',env=>expect(()=>probePorts(env)).toThrow());
it('refuses an occupied probe port without stopping its owner',async()=>{const server=createServer();await new Promise<void>(ok=>server.listen(0,'127.0.0.1',ok));try{const address=server.address() as {port:number};await expect(assertPortsFree({site:address.port})).rejects.toThrow('in use');expect(server.listening).toBe(true);}finally{await new Promise<void>(ok=>server.close(()=>ok()));}});
