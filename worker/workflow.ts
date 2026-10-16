import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from 'cloudflare:workers';
import type { Env, Subscriber } from './types';
import { jobStatement } from './db';
import manifest from '../.generated/manifest.json';
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
    for (const [index, delay] of ['3 days', '4 days', '7 days'].entries()) {
      await step.sleep(`wait-${index}`, delay as '3 days');
      const active = await step.do(`intent-${index}`, async () => {
        const s = await this.env.DB.prepare('SELECT * FROM subscriber WHERE id=?')
          .bind(event.payload.subscriberId)
          .first<Subscriber>();
        if (!s || s.status !== 'active' || s.generation !== event.payload.generation) return false;
        await jobStatement(
          this.env,
          `nurture:${s.id}:${s.generation}:v1:${index}`,
          'nurture',
          {
            subject: [
              'A useful place to start',
              'Care in the small details',
              'Ready for a conversation?',
            ][index],
            text: `Sample nurture copy — replace before production.\n${this.env.SITE_URL}/${manifest.routes.find(r=>r.locale===project.locale && r.contentId===(index===2?'contact':'insights'))?.path.slice(1) || project.locale}`,
          },
          s.id,
          s.generation,
        ).run();
        return true;
      });
      if (!active) return;
    }
    await step.do('complete', async () => {
      await this.env.DB.prepare(
        "UPDATE automation_enrollment SET state='completed' WHERE subscriber_id=? AND generation=? AND state='running'",
      )
        .bind(event.payload.subscriberId, event.payload.generation)
        .run();
    });
  }
}
export async function startEnrollments(env: Env) {
  if (!env.NURTURE) return;
  const records = await env.DB.prepare(
    "SELECT * FROM automation_enrollment WHERE state='pending' LIMIT 10",
  ).all<{ id: string; subscriber_id: string; generation: number }>();
  for (const r of records.results) {
    try {
      await env.NURTURE.create({
        id: r.id,
        params: { subscriberId: r.subscriber_id, generation: r.generation },
      });
    } catch {
      const existing = await env.NURTURE.get(r.id);
      await existing.status(); /* Verify existence instead of hiding quota/configuration failures. */
    }
    await env.DB.prepare(
      "UPDATE automation_enrollment SET state='running' WHERE id=? AND state='pending'",
    )
      .bind(r.id)
      .run();
  }
}
