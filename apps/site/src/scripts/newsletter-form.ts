import {createFormProtection} from './form-protection';
import {signupSchema} from '../../../../packages/contracts';
export interface NewsletterCoordinator {busy:boolean;listeners:Set<()=>void>}
interface RequestOptions {interest:string;token:()=>string|Promise<string>;reset?:()=>void;coordinator:NewsletterCoordinator;onAccepted:()=>void;fetch?:typeof fetch;uuid?:()=>string}
export function createNewsletterRequest(options:RequestOptions){
 let signature='',requestKey='',destroyed=false;let pending:AbortController|undefined;
 const notify=()=>options.coordinator.listeners.forEach(fn=>fn());
 return {
  async submit(email:string,consent:boolean):Promise<'invalid'|'busy'|'accepted'|'error'>{
   if(destroyed)return 'error';
   if(options.coordinator.busy)return 'busy';
   const next=JSON.stringify([email.trim(),consent,options.interest]);
   if(signature!==next){signature=next;requestKey=(options.uuid??(()=>crypto.randomUUID()))();}
   const parsed=signupSchema.safeParse({requestKey,email:email.trim(),consent,interest:options.interest,turnstileToken:'pending'});
   if(!parsed.success)return 'invalid';
   options.coordinator.busy=true;notify();let timeout:ReturnType<typeof setTimeout>|undefined;
   try{const turnstileToken=await options.token();if(destroyed)return 'error';const protectedPayload=signupSchema.safeParse({...parsed.data,turnstileToken});if(!protectedPayload.success)return 'error';pending=new AbortController();timeout=setTimeout(()=>pending?.abort(),20000);const response=await(options.fetch??fetch)('/api/newsletter/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(protectedPayload.data),signal:pending.signal});if(destroyed||pending.signal.aborted||response.status!==202)return 'error';options.onAccepted();return 'accepted';}
   catch{return 'error';}
   finally{clearTimeout(timeout);options.reset?.();pending=undefined;options.coordinator.busy=false;notify();}
  },destroy(){destroyed=true;pending?.abort();}
 };
}
export function initNewsletterForm(form:HTMLFormElement,options:Omit<RequestOptions,'token'|'reset'>&{messages:{invalid:string;error:string;sending:string}}){
 const email=form.elements.namedItem('email') as HTMLInputElement,consent=form.elements.namedItem('consent') as HTMLInputElement;
 const status=form.querySelector<HTMLElement>('[data-newsletter-status]')!,receipt=form.querySelector<HTMLElement>('[data-newsletter-receipt]')!,fields=form.querySelector<HTMLFieldSetElement>('fieldset')!;
 let destroyed=false;const protection=createFormProtection(form);const request=createNewsletterRequest({...options,token:()=>protection.token(),reset:()=>protection.reset()});
 const busy=()=>{fields.disabled=options.coordinator.busy;form.setAttribute('aria-busy',String(options.coordinator.busy));};options.coordinator.listeners.add(busy);
 function showReceipt(){status.textContent='';receipt.hidden=false;}
 async function submit(event:SubmitEvent){event.preventDefault();if(!form.reportValidity())return;status.textContent=options.messages.sending;const result=await request.submit(email.value,consent.checked);if(destroyed)return;if(result==='accepted')showReceipt();else if(result!=='busy')status.textContent=options.messages[result==='invalid'?'invalid':'error'];}
 form.addEventListener('submit',submit);busy();
 return {showReceipt,destroy(){destroyed=true;form.hidden=true;request.destroy();protection.destroy();form.removeEventListener('submit',submit);options.coordinator.listeners.delete(busy);}};
}
