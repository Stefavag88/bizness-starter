import {it,expect} from 'vitest';
import {environment} from './db';import {fanOut} from '../worker/campaigns';
it.each([500,5000,50000])('processes a %i-member campaign incrementally and preserves its cursor across ticks',async size=>{
 const f=environment();try{
 f.database.exec('BEGIN');for(let n=0;n<size;n++){const id=String(n).padStart(6,'0');f.database.prepare("INSERT INTO subscriber(id,email,email_key,status,generation,created_at,last_requested_at,confirmed_at,consent_version)VALUES(?,?,?,'active',1,0,0,0,'v1')").run(id,id+'@example.com',id+'@example.com');f.database.prepare('INSERT INTO subscriber_interest VALUES(?,?)').run(id,'updates');}f.database.exec('COMMIT');
 f.database.prepare("INSERT INTO campaign(id,request_key,snapshot_json,snapshot_hash,interest_id,state,cutoff_at,created_at)VALUES('c','c','{}','h','updates','dispatching',1,0)").run();
 await fanOut(f.env);const first=f.database.prepare('SELECT cursor FROM campaign').get()?.cursor;await fanOut(f.env);
 expect(f.database.prepare('SELECT COUNT(*) n FROM email_job').get()?.n).toBe(8);expect(f.database.prepare('SELECT cursor FROM campaign').get()?.cursor).not.toBe(first);
 expect(f.database.prepare('SELECT COUNT(DISTINCT dedupe_key) n FROM email_job').get()?.n).toBe(8);
 }finally{f.database.close();}});
