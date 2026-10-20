import {visitorStorageKey,readVisitorState,canAutoPrompt,updateVisitorState,resetVisitorState} from './visitor-state.mjs';
import type {VisitorStorage,VisitorChange} from './visitor-state.mjs';
import {createNewsletterScheduler} from './newsletter-scheduler';
import {initNewsletterForm} from './newsletter-form';
import {newsletterMessages} from './newsletter-messages';
const initialized=new WeakSet<HTMLElement>();
export function resetVisitorControls(root:HTMLElement){
 for(const control of Array.from(root.querySelectorAll<HTMLElement>('[data-newsletter-form], [data-newsletter-open], [data-preferences-open]')))control.hidden=true;
 for(const fallback of Array.from(root.querySelectorAll<HTMLElement>('[data-newsletter-fallback]')))fallback.hidden=false;
}

export function initVisitorExperience(root:HTMLElement){
 if(initialized.has(root))return ()=>{};
 initialized.add(root);
 if(!['localhost','127.0.0.1','[::1]'].includes(location.hostname)||typeof fetch!=='function'||typeof crypto.randomUUID!=='function'){initialized.delete(root);return ()=>{};}
 const key=visitorStorageKey(root.dataset.project!),policy={dismissDays:Number(root.dataset.dismissDays),acceptedDays:Number(root.dataset.acceptedDays)};
 const unavailable:VisitorStorage={getItem(){throw Error('Unavailable')},setItem(){throw Error('Unavailable')},removeItem(){throw Error('Unavailable')}};
 let storage:VisitorStorage;try{storage=window.localStorage;}catch{storage=unavailable;}
 let snapshot=readVisitorState(storage,key,Date.now());
 const messages=newsletterMessages(document.documentElement.lang);
 const newsletter=root.querySelector<HTMLDialogElement>('[data-newsletter-dialog]'),preferences=root.querySelector<HTMLDialogElement>('[data-preferences-dialog]');
 const dialogSupported=typeof HTMLDialogElement!=='undefined'&&typeof HTMLDialogElement.prototype.showModal==='function';
 const removers:(()=>void)[]=[];const listen=(target:EventTarget,type:string,fn:EventListener)=>{target.addEventListener(type,fn);removers.push(()=>target.removeEventListener(type,fn));};
 const coordinator={busy:false,listeners:new Set<()=>void>()};let stopped=false,memoryAccepted=false,trigger:HTMLElement|null=null;
 function change(action:VisitorChange){const previous=snapshot;const next=updateVisitorState(storage,key,action,policy,Date.now());if(next.status==='blocked'||next.status==='invalid')next.state={...previous.state,...(action==='accepted'?{acceptedUntil:Date.now()+policy.acceptedDays*86400000}:action==='dismissed'||action==='autoShown'?{dismissedUntil:Date.now()+policy.dismissDays*86400000}:action)};snapshot=next;return next;}
 function show(dialog:HTMLDialogElement,from:HTMLElement|null){if(!dialogSupported||dialog.open||document.querySelector('dialog[open]'))return false;trigger=from;try{dialog.showModal();dialog.querySelector<HTMLInputElement>('input[type="email"]')?.focus();return true;}catch{return false;}}
 const forms=Array.from(root.querySelectorAll<HTMLFormElement>('[data-newsletter-form]')).map(form=>initNewsletterForm(form,{interest:root.dataset.interest!,token:()=> 'local-preview',coordinator,messages,onAccepted(){memoryAccepted=true;change('accepted');scheduler.stop();forms.forEach(controller=>controller.showReceipt());}}));
 const safeToOpen=()=>!memoryAccepted&&!stopped&&document.visibilityState==='visible'&&!coordinator.busy&&!document.querySelector('dialog[open]')&&!(document.activeElement?.closest('form')||document.activeElement?.matches('input,textarea,select,[contenteditable="true"]'))&&canAutoPrompt(readVisitorState(storage,key,Date.now()),policy,Date.now());
 const scheduler=createNewsletterScheduler({delaySeconds:Number(root.dataset.delaySeconds),document,canOpen:safeToOpen,open(){if(!newsletter||!safeToOpen())return false;const saved=change('autoShown');if(saved.status!=='valid')return false;return show(newsletter,document.activeElement instanceof HTMLElement&&document.activeElement!==document.body?document.activeElement:document.querySelector<HTMLElement>('.brand'));}});
 for(const form of Array.from(root.querySelectorAll<HTMLElement>('[data-newsletter-form]')))form.hidden=false;
 for(const fallback of Array.from(root.querySelectorAll<HTMLElement>('[data-newsletter-fallback]'))){const inline=Boolean(fallback.parentElement?.querySelector('[data-newsletter-form]'));if(inline||dialogSupported&&newsletter)fallback.hidden=true;}
 for(const button of Array.from(root.querySelectorAll<HTMLButtonElement>('[data-newsletter-open]'))){if(!dialogSupported||!newsletter)continue;button.hidden=false;listen(button,'click',()=>show(newsletter,button));}
 if(dialogSupported){for(const dialog of [newsletter,preferences])if(dialog){
  for(const button of Array.from(dialog.querySelectorAll('[data-dialog-close]')))listen(button,'click',()=>dialog.close());
  listen(dialog,'close',()=>{if(dialog===newsletter)change('dismissed');const target=trigger?.isConnected?trigger:document.querySelector<HTMLElement>('.brand');if(!document.querySelector('dialog[open]'))target?.focus();scheduler.reconsider();});
 }}
 const checkbox=preferences?.querySelector<HTMLInputElement>('[data-prompts-allowed]');const preferenceStatus=preferences?.querySelector<HTMLElement>('[data-preferences-status]');
 function syncPreference(){if(checkbox)checkbox.checked=snapshot.state.promptsAllowed;}
 for(const button of Array.from(root.querySelectorAll<HTMLButtonElement>('[data-preferences-open]'))){if(!dialogSupported||!preferences)continue;button.hidden=false;listen(button,'click',()=>{const origin=newsletter?.contains(button)?root.querySelector<HTMLElement>('[data-preferences-open-footer]'):button;if(newsletter?.open)newsletter.close();syncPreference();show(preferences,origin??null);});}
 if(checkbox)listen(checkbox,'change',()=>{const state=change({promptsAllowed:checkbox.checked});if(preferenceStatus)preferenceStatus.textContent=state.status==='valid'?messages.saved:messages.sessionOnly;scheduler.reconsider();});
 const reset=preferences?.querySelector('[data-preferences-reset]');if(reset)listen(reset,'click',()=>{snapshot=resetVisitorState(storage,key,Date.now());memoryAccepted=false;syncPreference();if(preferenceStatus)preferenceStatus.textContent=snapshot.status==='blocked'?messages.sessionOnly:messages.resetDone;scheduler.reconsider();});
 listen(window,'storage',((event:StorageEvent)=>{if(event.key!==key&&event.key!==null)return;snapshot=readVisitorState(storage,key,Date.now());syncPreference();scheduler.reconsider();}) as EventListener);
 for(const type of ['visibilitychange','focusout','focusin'])listen(document,type,()=>scheduler.reconsider());
 // Native close events do not bubble. Defer again after another dialog closes.
 for(const dialog of Array.from(document.querySelectorAll('dialog')))listen(dialog,'close',()=>scheduler.reconsider());
 if(root.dataset.autoEligible==='true'&&dialogSupported&&newsletter)scheduler.start();
 return ()=>{stopped=true;scheduler.stop();forms.forEach(f=>f.destroy());removers.forEach(fn=>fn());resetVisitorControls(root);if(newsletter?.open)newsletter.close();if(preferences?.open)preferences.close();initialized.delete(root);};
}
