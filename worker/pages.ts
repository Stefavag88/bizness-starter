import { escapeHtml } from '../packages/contracts';
import type { Env } from './types';
export function html(title: string, content: string, script = '', styles = '') {
  const nonce = crypto.randomUUID();
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title><style nonce="${nonce}">body{font:16px/1.65 system-ui;background:#f5f4ed;color:#28382c;margin:0}main{max-width:900px;margin:60px auto;padding:24px}h1{font:48px Georgia}a{color:inherit}input,textarea,select,button{font:inherit;padding:10px;margin:7px 0}label{display:block}input,textarea{max-width:100%;box-sizing:border-box}button{background:#28382c;color:white;border:0;cursor:pointer}article{border:1px solid #ccd2c1;padding:24px;margin:20px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere}.actions{display:flex;gap:12px;flex-wrap:wrap}${styles}</style></head><body><main><a href="/">← Back to website</a><h1>${escapeHtml(title)}</h1>${content}</main>${script ? `<script nonce="${nonce}">${script}</script>` : ''}</body></html>`,
    {
      headers: {
        'Content-Type': 'text/html;charset=utf-8',
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Robots-Tag': 'noindex',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
      },
    },
  );
}
export function tokenPage(kind: 'confirm' | 'unsubscribe', token: string) {
  if (!token)
    return html(
      kind === 'confirm' ? 'Confirm your updates' : 'Unsubscribe',
      '<p>Open the personal link in your email to continue.</p>',
    );
  return html(
    kind === 'confirm' ? 'Confirm your updates' : 'Unsubscribe',
    `<p>${kind === 'confirm' ? 'Confirm that you requested email updates.' : 'Stop all marketing emails. No sign-in is needed.'}</p><form method="post" action="/api/newsletter/${kind}"><input type="hidden" name="token" value="${escapeHtml(token)}"><button>${kind === 'confirm' ? 'Confirm subscription' : 'Unsubscribe'}</button></form>`,
  );
}
export function adminPage(env: Env) {
  return html(
    'Campaign studio',
    `<p><a href="/admin/usage">Usage &amp; Capacity</a></p><p>Review the content, send an allowlisted test, then approve before sending. Publishing an article does not send email.</p><label>Use CMS campaign copy<select id="source"><option value="">Write a new draft</option></select></label><form id="draft"><label>Subject<input name="subject" required maxlength="150"></label><label>Introduction<textarea name="intro" required></textarea></label><label>Article ID (optional)<input name="articleId"></label><label>Interest ID<input name="interest" value="updates" required></label><button>Create draft</button></form><p id="status" role="status" aria-live="polite"></p><div id="campaigns"></div>`,
    `
 const $=s=>document.querySelector(s);const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function api(url,data){const r=await fetch(url,{method:data?'POST':'GET',headers:{'Content-Type':'application/json'},body:data?JSON.stringify(data):undefined});const j=await r.json();if(!r.ok)throw Error(j.message);return j;}
 let sources=[];api('/api/admin/campaign-sources').then(data=>{sources=data.campaigns;$('#source').innerHTML+=sources.map(s=>'<option value="'+esc(s.id)+'">'+esc(s.subject)+'</option>').join('');});$('#source').addEventListener('change',e=>{const s=sources.find(x=>x.id===e.target.value);if(s)for(const key of ['subject','intro','articleId','interest'])$('#draft').elements[key].value=s[key]||'';});
 async function load(){const {campaigns}=await api('/api/admin/campaigns');$('#campaigns').innerHTML=campaigns.map(c=>'<article><h2>'+esc(JSON.parse(c.snapshot_json).subject)+'</h2><p>'+esc(c.state)+'</p><pre>'+esc(JSON.parse(c.snapshot_json).text)+'</pre><p>Eligible audience: '+c.audience_count+'</p><div class="actions">'+['test','approve','send','pause'].map(action=>'<button data-id="'+c.id+'" data-hash="'+c.snapshot_hash+'" data-action="'+action+'">'+action+'</button>').join('')+'</div></article>').join('');}
 $('#draft').addEventListener('submit',async e=>{e.preventDefault();try{const data=Object.fromEntries(new FormData(e.target));if(!data.articleId)delete data.articleId;await api('/api/admin/campaigns',{...data,requestKey:crypto.randomUUID()});e.target.reset();await load();}catch(e){$('#status').textContent=e.message;}});
 $('#campaigns').addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;const data={hash:b.dataset.hash};if(b.dataset.action==='send'){try{const estimate=await api('/api/admin/campaigns/'+b.dataset.id+'/estimate');const message='Estimated completion: '+(estimate.completionFrom?'approximately '+estimate.completionFrom:'not available')+' (conditional). Audience: '+estimate.eligible.count+(estimate.eligible.exact?'':'+')+'. Remaining dispatch allowance today: '+(estimate.dailyAllowance.remaining??'Not configured')+'. '+estimate.constraints.join(', ');data.confirmation=prompt(message+'\\nType SEND to send this approved snapshot to its audience.');if(data.confirmation!=='SEND')return;}catch(error){$('#status').textContent=error.message;return;}}if(b.dataset.action==='test'){data.to=prompt('Allowlisted test recipient');if(!data.to)return;}try{await api('/api/admin/campaigns/'+b.dataset.id+'/'+b.dataset.action,data);$('#status').textContent='Action accepted';await load();}catch(e){$('#status').textContent=e.message;}});load().catch(e=>$('#status').textContent=e.message);
 `,
  );
}
