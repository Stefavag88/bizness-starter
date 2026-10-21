import {workContext,meterEnvironment,type WorkContext,type WorkResult} from './budget';
import {readAdmissionDay} from './admissions';
import {parseRuntimeBudget} from '../packages/config/runtime-budgets.mjs';
import { campaignSchema, hash } from '../packages/contracts';
import manifest from './manifest';
import project from '../project.json';
import type { Env, Campaign } from './types';
import { jobStatement, now } from './db';
import { HttpError } from './security';
export async function createCampaign(env: Env, input: unknown) {
  const data = campaignSchema.parse(input);
  if (!project.interests.some((i) => i.id === data.interest))
    throw new HttpError(400, 'Unknown audience.');
  const article = data.articleId
    ? manifest.articles.find((a) => a.id === data.articleId)
    : undefined;
  if (data.articleId && !article) throw new HttpError(400, 'Choose a published article.');
  const snapshot = {
    subject: data.subject,
    text: `${data.intro}${article ? `\n\n${article.title}\n${article.description}\n${article.url}?utm_source=newsletter&utm_medium=email` : ''}`,
  };
  const snapshotJson = JSON.stringify(snapshot);
  const id = crypto.randomUUID();
  await env.DB.prepare(
    "INSERT OR IGNORE INTO campaign(id,request_key,snapshot_json,snapshot_hash,interest_id,state,created_at) VALUES(?,?,?,?,?,'draft',?)",
  )
    .bind(
      id,
      data.requestKey,
      snapshotJson,
      await hash(`${snapshotJson}:${data.interest}`),
      data.interest,
      now(),
    )
    .run();
  return env.DB.prepare('SELECT * FROM campaign WHERE request_key=?')
    .bind(data.requestKey)
    .first<Campaign>();
}
export async function campaignAction(
  env: Env,
  id: string,
  action: string,
  input: Record<string, unknown>,
  user: string,
) {
  const campaign = await env.DB.prepare('SELECT * FROM campaign WHERE id=?')
    .bind(id)
    .first<Campaign>();
  if (!campaign) throw new HttpError(404, 'Campaign not found.');
  if (action === 'test') {
    const to = String(input.to || '');
    if (!env.ALLOWED_RECIPIENTS.split(',').includes(to))
      throw new HttpError(400, 'Test recipient is not allowlisted.');
    const snapshot = JSON.parse(campaign.snapshot_json);
    await jobStatement(env, `test:${id}:${crypto.randomUUID()}`, 'test', { to, ...snapshot }).run();
    return;
  }
  if (input.hash !== campaign.snapshot_hash)
    throw new HttpError(409, 'Campaign revision changed. Review it again.');
  if (action === 'approve') {
    if (campaign.state !== 'draft') throw new HttpError(409, 'Only drafts can be approved.');
    await env.DB.prepare(
      "UPDATE campaign SET state='approved',approved_by=?,approved_at=?,approval_hash=snapshot_hash WHERE id=? AND state='draft'",
    )
      .bind(user, now(), id)
      .run();
  } else if (action === 'send') {
    if (input.confirmation !== 'SEND')
      throw new HttpError(400, 'Type SEND to confirm this campaign.');
    if (campaign.state === 'dispatching' || campaign.state === 'completed') return;
    if (campaign.state !== 'approved' || campaign.approval_hash !== campaign.snapshot_hash)
      throw new HttpError(409, 'Approve this snapshot first.');
    if (env.ENVIRONMENT !== 'local' && env.MARKETING_ENABLED !== 'true')
      throw new HttpError(409, 'Marketing is disabled.');
    await env.DB.prepare(
      "UPDATE campaign SET state='dispatching',cutoff_at=? WHERE id=? AND state='approved' AND approval_hash=snapshot_hash",
    )
      .bind(now(), id)
      .run();
  } else if (action === 'pause') {
    await env.DB.prepare("UPDATE campaign SET state='paused' WHERE id=? AND state='dispatching'")
      .bind(id)
      .run();
  } else throw new HttpError(404, 'Unknown action.');
}
export async function fanOut(env:Env,context:WorkContext=workContext(env)):Promise<WorkResult>{
 const {scope,at}=context;const hold=scope.tryReserve('campaign',{sqlStatements:10,externalCalls:0,internalCalls:20});
 if(!hold)return {processed:0,deferred:true};const e=meterEnvironment(env,scope,hold,at);
 try{
  const cfg=parseRuntimeBudget(env.RUNTIME_BUDGET);
  if(cfg.dailyDispatchLimit!==null){const day=await readAdmissionDay(e,at);if(!day.remaining||day.marketingUsed>=cfg.dailyDispatchLimit-cfg.transactionalReserve)return {processed:0,deferred:true};}
  else if(env.ENVIRONMENT!=='local')return {processed:0,deferred:true};
  const cursor=await e.DB.prepare("SELECT position FROM runtime_cursor WHERE key='campaign-turn'").first<{position:string}>();
  const campaign=await e.DB.prepare("SELECT * FROM campaign WHERE id=COALESCE((SELECT id FROM campaign WHERE state='dispatching' AND id>? ORDER BY id LIMIT 1),(SELECT id FROM campaign WHERE state='dispatching' ORDER BY id LIMIT 1))").bind(cursor?.position??'').first<Campaign & {id:string}>();
  if(!campaign)return {processed:0,deferred:false};
  await e.DB.prepare("INSERT INTO runtime_cursor(key,position)VALUES('campaign-turn',?) ON CONFLICT(key)DO UPDATE SET position=excluded.position").bind(campaign.id).run();
  const cap=Math.min(scope.policy.maxFanoutRecipients,hold.remaining().sqlStatements-2);
  if(cap<1)return {processed:0,deferred:true};
  const subscribers=await e.DB.prepare("SELECT s.id,s.generation FROM subscriber s JOIN subscriber_interest i ON s.id=i.subscriber_id WHERE s.status='active' AND i.interest_id=? AND s.confirmed_at<=? AND s.id>? ORDER BY s.id LIMIT ?").bind(campaign.interest_id,campaign.cutoff_at,campaign.cursor,cap).all<{id:string;generation:number}>();
  const snapshot=JSON.parse(campaign.snapshot_json);
  const statements=subscribers.results.map(s=>jobStatement(e,`campaign:${campaign.id}:${s.id}`,'campaign',snapshot,s.id,s.generation,campaign.id));
  statements.push(subscribers.results.length?e.DB.prepare('UPDATE campaign SET cursor=? WHERE id=?').bind(subscribers.results.at(-1)!.id,campaign.id):e.DB.prepare("UPDATE campaign SET state='completed' WHERE id=? AND state='dispatching'").bind(campaign.id));
  await e.DB.batch(statements);return {processed:subscribers.results.length,deferred:subscribers.results.length===cap};
 }finally{hold.releaseUnused();}
}
