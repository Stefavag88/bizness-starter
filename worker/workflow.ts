import {validateRuntimeDeployment} from './deployment';
import {workContext,meterEnvironment,type WorkContext,type WorkResult} from './budget';
import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import type { Env, Subscriber } from './types';
import { jobStatement } from './db';
import {persistUsage} from './usage';
import manifest from './manifest';
import project from '../project.json';
// Versioned sample content. Replace and review before enabling real nurture.
export class WelcomeWorkflow extends WorkflowEntrypoint<
  Env,
  { subscriberId: string; generation: number }
> {
  async run(
    event: WorkflowEvent<{ subscriberId: string; generation: number }>,
    step: WorkflowStep,
  ) {
    validateRuntimeDeployment(this.env);
    const context=workContext(this.env,'workflow');const e=meterEnvironment(this.env,context.scope,undefined,context.at);
    for (const [index, delay] of ['3 days', '4 days', '7 days'].entries()) {
      await step.sleep(`wait-${index}`, delay as '3 days');
      const active = await step.do(`intent-${index}`, async () => {
        const at=Date.now(),baseline=context.scope.snapshot().attempted;try{
        const s = await e.DB.prepare('SELECT * FROM subscriber WHERE id=?')
          .bind(event.payload.subscriberId)
          .first<Subscriber>();
        if (!s || s.status !== 'active' || s.generation !== event.payload.generation) {
          await e.DB.prepare(
            "UPDATE automation_enrollment SET state='cancelled' WHERE subscriber_id=? AND generation=? AND state IN ('pending','running')",
          ).bind(event.payload.subscriberId, event.payload.generation).run();
          return false;
        }
        await jobStatement(
          e,
          `nurture:${s.id}:${s.generation}:v1:${index}`,
          'nurture',
          {
            subject: [
              'A useful place to start',
              'Care in the small details',
              'Ready for a conversation?',
            ][index],
            text: `Sample nurture copy — replace before production.\n${e.SITE_URL}/${manifest.routes.find(r=>r.locale===project.locale && r.contentId===(index===2?'contact':'insights'))?.path.slice(1) || project.locale}`,
          },
          s.id,
          s.generation,
        ).run();
        return true;
        }finally{await persistUsage(e,context.scope,{entrypoint:"workflow-step",at,baseline});}
      });
      if (!active) return;
    }
    await step.do('complete', async () => {
      const at=Date.now(),baseline=context.scope.snapshot().attempted;try{
      await e.DB.prepare(
        "UPDATE automation_enrollment SET state='completed' WHERE subscriber_id=? AND generation=? AND state IN ('pending','running')",
      )
        .bind(event.payload.subscriberId, event.payload.generation)
        .run();
      }finally{await persistUsage(e,context.scope,{entrypoint:"workflow-step",at,baseline});}
    });
  }
}
// Keep terminal D1 states monotonic; a platform lookup never restarts an instance.
function enrollmentState(status: InstanceStatus['status']) {
  switch (status) {
    case 'complete': return 'completed';
    case 'errored': return 'failed';
    case 'terminated': return 'cancelled';
    case 'queued':
    case 'running':
    case 'paused':
    case 'waiting':
    case 'waitingForPause':
    case 'rollingBack': return 'running';
    default: throw new Error('Workflow status is unknown; enrollment retained for investigation.');
  }
}
interface Enrollment { id: string; subscriber_id: string; generation: number; state: string; cursor_position: number; }
async function reconciliationBatch(env: Env, state: 'pending'|'running', limit: number) {
  const select = () => env.DB.prepare(
    `SELECT rowid AS cursor_position,* FROM automation_enrollment WHERE state=?
     AND rowid>COALESCE((SELECT position FROM automation_cursor WHERE state=?),0)
     ORDER BY rowid LIMIT ?`,
  ).bind(state,state,limit).all<Enrollment>();
  let records = await select();
  if (!records.results.length) {
    await env.DB.prepare('INSERT INTO automation_cursor(state,position) VALUES(?,0) ON CONFLICT(state) DO UPDATE SET position=0').bind(state).run();
    records = await select();
  }
  if (records.results.length) {
    await env.DB.prepare('INSERT INTO automation_cursor(state,position) VALUES(?,?) ON CONFLICT(state) DO UPDATE SET position=excluded.position')
      .bind(state,records.results.at(-1)!.cursor_position).run();
  }
  return records.results;
}
async function reconcileEnrollments(env: Env) {
  if (!env.NURTURE) return;
  // Independent small batches reserve work for new enrollments and leave room for
  // transactional dispatch. Durable cursors rotate even failed platform lookups.
  const records = [
    ...await reconciliationBatch(env,'pending',1),
    ...await reconciliationBatch(env,'running',1),
  ];
  const errors: unknown[] = [];
  for (const r of records) {
    try {
      const subscriber = await env.DB.prepare('SELECT * FROM subscriber WHERE id=?')
        .bind(r.subscriber_id).first<Subscriber>();
      if (!subscriber || subscriber.status !== 'active' || subscriber.generation !== r.generation) {
        await env.DB.prepare(
          "UPDATE automation_enrollment SET state='cancelled' WHERE id=? AND state IN ('pending','running')",
        ).bind(r.id).run();
        continue;
      }
      let instance: WorkflowInstance;
      if (r.state === 'pending') {
        try {
          instance = await env.NURTURE.create({
            id: r.id,
            params: { subscriberId: r.subscriber_id, generation: r.generation },
          });
        } catch {
          // Creation can have succeeded before a response failure. Inspect, never restart.
          instance = await env.NURTURE.get(r.id);
        }
      } else {
        instance = await env.NURTURE.get(r.id);
      }
      const state = enrollmentState((await instance.status()).status);
      await env.DB.prepare(
        `UPDATE automation_enrollment SET state=? WHERE id=? AND state=?
         AND EXISTS (SELECT 1 FROM subscriber WHERE id=? AND status='active' AND generation=?)`,
      ).bind(state, r.id, r.state, r.subscriber_id, r.generation).run();
      // Consent may change while awaiting the platform. Never resurrect that generation.
      await env.DB.prepare(
        `UPDATE automation_enrollment SET state='cancelled' WHERE id=? AND state IN ('pending','running')
         AND NOT EXISTS (SELECT 1 FROM subscriber WHERE id=? AND status='active' AND generation=?)`,
      ).bind(r.id, r.subscriber_id, r.generation).run();
    } catch (error) {
      errors.push(new Error(`Enrollment ${r.id} reconciliation failed`, { cause: error }));
    }
  }
  if (errors.length) throw new AggregateError(errors, 'Enrollment reconciliation failed');
  return records.length;
}

export async function startEnrollments(env:Env,context:WorkContext=workContext(env)):Promise<WorkResult>{
 if(!env.NURTURE)return {processed:0,deferred:false};const hold=context.scope.tryReserve('enrollment',{sqlStatements:14,externalCalls:0,internalCalls:40});
 if(!hold)return {processed:0,deferred:true};
 try{const processed=await reconcileEnrollments(meterEnvironment(env,context.scope,hold,context.at));return {processed:processed??0,deferred:(processed??0)>0};}finally{hold.releaseUnused();}
}
