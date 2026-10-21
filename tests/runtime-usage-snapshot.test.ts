import {it,expect} from 'vitest';import {environment} from './db';import {readUsageSnapshot} from '../worker/usage';
const at=Date.parse('2026-10-21T12:00:00Z'),window={from:'2026-10-15',to:'2026-10-21'};
it('distinguishes zero admissions from unavailable provider readings without writing telemetry',async()=>{const f=environment('enquiries');try{
 f.env.RUNTIME_BUDGET=JSON.stringify({dailyDispatchLimit:10,transactionalReserve:3});
 const snapshot=await readUsageSnapshot(f.env,window,at);expect(snapshot.admission.used).toBe(0);expect(snapshot.admission.remaining).toBe(10);
 expect(snapshot.provider.status).toBe('not_configured');expect(snapshot.provider.metrics.every(m=>m.value===null)).toBe(true);
 expect(snapshot.application.every(m=>m.value===null)).toBe(true);expect(snapshot.history).toHaveLength(7);
 await readUsageSnapshot(f.env,window,at);expect(f.database.prepare('SELECT COUNT(*) n FROM runtime_usage_day').get()?.n).toBe(0);
 }finally{f.database.close();}});
it('returns bounded backlog counts and safe data rather than full records',async()=>{const f=environment();try{
 const insert=f.database.prepare("INSERT INTO email_job(id,dedupe_key,kind,payload_json,available_at,created_at)VALUES(?,?,'inquiry',?,0,0)");
 for(let i=0;i<1002;i++)insert.run('j'+i,'j'+i,'{"email":"secret@example.com"}');
 const result=await readUsageSnapshot(f.env,window,at);expect(result.backlog.pending).toEqual({count:1000,exact:false});expect(JSON.stringify(result)).not.toContain('secret@example.com');
 }finally{f.database.close();}});
it.each([{from:'2026-02-31',to:'2026-03-01'},{from:'2026-10-01',to:'2026-10-21'},{from:'2026-10-21',to:'2026-10-20'}])('rejects an invalid window before database reads',async window=>{const f=environment();try{
 f.env.DB={prepare:()=>{throw Error('must not query');}} as any;await expect(readUsageSnapshot(f.env,window,at)).rejects.toMatchObject({status:400});
 }finally{f.database.close();}});

it('keeps genuine zero observations and other cards when one data source fails',async()=>{const f=environment();try{
 f.database.prepare("INSERT INTO runtime_usage_day(day,entrypoint,observations,last_observed_at)VALUES('2026-10-21','queue',1,?)").run(at);
 const db=f.env.DB;f.env.DB={prepare:(sql:string)=>{if(sql.includes('runtime_admission_day')||sql.includes('LIMIT 1001')&&sql.includes('email_job'))throw Error('unavailable');return db.prepare(sql);}} as any;
 const result=await readUsageSnapshot(f.env,window,at);expect(result.admission.used).toBeNull();expect(result.admission.status).toBe('unavailable');expect(result.application[0]).toMatchObject({value:0,status:'partial'});expect(result.history[6].accepted).toBe(0);expect(result.history[0].accepted).toBeNull();expect(result.backlog.pending.exact).toBe(false);
 }finally{f.database.close();}});
