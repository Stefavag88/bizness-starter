export interface TurnstileApi {
 render(element:HTMLElement,options:Record<string,unknown>):string;
 execute(id:string):void;remove(id:string):void;
}
type ProtectedWindow=Window&{turnstile?:TurnstileApi};
const loaders=new WeakMap<Document,Promise<TurnstileApi>>();
export function loadTurnstile(doc:Document=document):Promise<TurnstileApi>{
 const win=doc.defaultView as ProtectedWindow|null;
 if(win?.turnstile)return Promise.resolve(win.turnstile);
 const existing=loaders.get(doc);if(existing)return existing;
 let script:HTMLScriptElement;
 const promise=new Promise<TurnstileApi>((resolve,reject)=>{
  script=doc.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.defer=true;
  const timeout=setTimeout(()=>finish(false),10000);
  function finish(ok:boolean){clearTimeout(timeout);script.onload=null;script.onerror=null;if(ok&&win?.turnstile)resolve(win.turnstile);else{script.remove();reject(Error('Security script unavailable'));}}
  script.onload=()=>finish(true);script.onerror=()=>finish(false);doc.head.appendChild(script);
 });
 loaders.set(doc,promise);void promise.catch(()=>{if(loaders.get(doc)===promise)loaders.delete(doc);});return promise;
}
export function createFormProtection(form:HTMLFormElement,options:{load?:()=>Promise<TurnstileApi>;hostname?:string}={}){
 const mode=form.dataset.protectionMode,key=form.dataset.protectionKey??'',action=form.dataset.protectionAction;
 const hostname=options.hostname??globalThis.location?.hostname;
 const message=form.dataset.locale==='el'?'Δεν ολοκληρώθηκε ο έλεγχος ασφαλείας. Δοκιμάστε ξανά.':'The security check could not be completed. Please try again.';
 let destroyed=false,widget:{api:TurnstileApi;id:string}|undefined;
 let current:{reject:(error:Error)=>void;timer:ReturnType<typeof setTimeout>}|undefined;
 const remove=()=>{if(widget){try{widget.api.remove(widget.id);}catch{}widget=undefined;}};
 const reset=()=>{if(current){const pending=current;current=undefined;clearTimeout(pending.timer);pending.reject(Error(message));}remove();};
 return {
  token():Promise<string>{
   if(destroyed)return Promise.reject(Error(message));
   if(mode==='local'&&['localhost','127.0.0.1','[::1]'].includes(hostname??''))return Promise.resolve('local-preview');
   if(mode!=='turnstile'||!key||!['contact','subscribe'].includes(action??'')||current)return Promise.reject(Error(message));
   const element=form.querySelector<HTMLElement>('[data-form-protection]');if(!element)return Promise.reject(Error(message));
   remove();
   return new Promise<string>((resolve,reject)=>{
    const pending={reject,timer:setTimeout(()=>finish(),45000)};current=pending;
    function finish(token?:string){if(current!==pending)return;current=undefined;clearTimeout(pending.timer);if(token&&token.length<=2048)resolve(token);else{remove();reject(Error(message));}}
    void (async()=>{
     const api=await (options.load??(()=>loadTurnstile(form.ownerDocument)))();if(destroyed||current!==pending)return;
     const id=api.render(element,{sitekey:key,action,language:form.dataset.locale??'auto',theme:'auto',size:'flexible',execution:'execute',appearance:'interaction-only',retry:'never','refresh-expired':'manual','refresh-timeout':'manual','response-field':false,
      callback:(token:string)=>finish(token),'expired-callback':()=>finish(),'timeout-callback':()=>finish(),'error-callback':()=>{finish();return true;},
     });
     widget={api,id};if(current===pending)api.execute(id);else remove();
    })().catch(()=>finish());
   });
  },reset,destroy(){destroyed=true;reset();},
 };
}
