import {z} from 'zod';
import {isIP} from 'node:net';
import {parseProject} from '../../packages/config/project.mjs';
const targetSchema=z.strictObject({
 format:z.literal(1),application:z.string().regex(/^[a-z0-9-]{1,40}$/),target:z.literal('production'),
 accountId:z.string().regex(/^[a-f0-9]{32}$/),siteUrl:z.string(),
 infrastructure:z.record(z.string(),z.unknown()).default({}),
});
export function parseProductionTarget(raw,source){
 const target=targetSchema.parse(raw);
 if(target.application!==source.name)throw Error('Production target application must match project.name');
 // Resolve from empty infrastructure defaults, never from the local instance.
 const project=parseProject({...source,environment:'production',siteUrl:target.siteUrl,infrastructure:target.infrastructure});
 const url=new URL(project.siteUrl);
 if(url.port||isIP(url.hostname.replace(/^\[|\]$/g,''))||!url.hostname.includes('.'))throw Error('Production custom domain must be a DNS hostname without a nonstandard port');
 return {application:target.application,accountId:target.accountId,project};
}
const placeholder=value=>/^([0-9a-f])\1+$/.test(value.replaceAll('-',''));
export function productionIssues(target){
 const {project:p,accountId}=target,i=p.infrastructure,issues=[];
 const host=new URL(p.siteUrl).hostname;
 if(placeholder(accountId))issues.push('Replace the placeholder Cloudflare account ID.');
 if(placeholder(i.databaseId))issues.push('Configure the production D1 database UUID.');
 if(/(^|\.)(example\.(com|org|net)|localhost|test|invalid)$/.test(host)||host.endsWith('.example')||host==='127.0.0.1'||host==='[::1]')issues.push('Configure the final production domain.');
 if(!p.contentReviewed||!p.legalReviewed)issues.push('Review actual business content and legal wording.');
 if(!i.accessIssuer||!i.accessAudience||!i.adminEmails.length)issues.push('Configure production Access issuer, audience and administrator identities.');
 if(i.providerAnalytics.enabled&&i.providerAnalytics.accountId!==accountId)issues.push('The analytics account must match the production deployment account.');
 if(!i.turnstileSiteKey||/^[123]x0{10}/.test(i.turnstileSiteKey))issues.push('Configure a real production Turnstile public site key; testing keys do not protect a hosted form.');
 if(i.runtimeBudget.dailyDispatchLimit===null)issues.push('Configure and qualify a production dispatch allowance before enabling dispatch.');
 if(!i.sendingEnabled)issues.push('Real transactional sending is disabled; complete controlled delivery verification before enabling it.');
 if(i.sendingEnabled&&(!i.snsTopicArn||i.sender.includes('example.')||i.notificationEmail.includes('example.')))issues.push('Configure verified sending identities, recipient and SES/SNS feedback.');
 if(p.profile!=='enquiries'&&!i.marketingEnabled)issues.push('Marketing delivery is disabled; qualify the subscription lifecycle before enabling it.');
 if(p.profile==='nurture')issues.push('Replace and review sample nurture messages before hosted use.');
 issues.push('Hosted CMS publishing, Access login and security-header coverage still require verification.');
 issues.push('Hosted Turnstile hostname/action, secret bindings and account readiness still require verification.');
 issues.push('Owner-approved personal-data retention and recovery procedures still require implementation and rehearsal.');
 issues.push('Hosted runtime, D1 row, CPU and provider capacity qualification remains pending.');
 return issues;
}
