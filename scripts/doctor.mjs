import {readFileSync} from 'node:fs';
import {parseProject} from '../packages/config/project.mjs';
const p=parseProject(JSON.parse(readFileSync('project.json','utf8')));
if(process.argv.includes('--production')){
 const issues=[];
 if(p.environment!=='production')issues.push('Set the intended production environment.');
 if(!p.contentReviewed||!p.legalReviewed)issues.push('Review business content and legal wording.');
 if(p.siteUrl.includes('example.')||p.infrastructure.sender.includes('example.')||p.infrastructure.notificationEmail.includes('example.'))issues.push('Replace example domain, sender and recipient.');
 if(p.infrastructure.databaseId==='00000000-0000-0000-0000-000000000000')issues.push('Configure a project-specific D1 database.');
 if(!p.infrastructure.accessIssuer||!p.infrastructure.accessAudience||!p.infrastructure.adminEmails.length)issues.push('Configure hosted CMS and administration Access protection with at least one administrator.');
 if(!p.infrastructure.snsTopicArn)issues.push('Configure verified SES feedback.');
 if(!p.infrastructure.sendingEnabled)issues.push('Review transactional delivery readiness before enabling sending.');
 if(p.profile!=='enquiries'&&!p.infrastructure.marketingEnabled)issues.push('Review subscription lifecycle before enabling marketing.');
 if(p.profile==='nurture')issues.push('Replace and review the sample nurture messages before hosted use.');
 // Foundation scope supplies local CMS/form preview only; hosted integration is a separate review.
 issues.push('Configure and verify the hosted CMS build, form-protection client, secrets and account readiness.');
 console.error('Production readiness blocked:\n'+issues.map(i=>'- '+i).join('\n'));process.exitCode=1;
}else console.log(`Local ${p.profile} configuration validated. Sending remains capture-only in local D1. No cloud credentials required.`);
