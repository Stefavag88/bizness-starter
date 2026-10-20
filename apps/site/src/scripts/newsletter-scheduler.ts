interface Clock {now():number;setTimeout(fn:()=>void,ms:number):ReturnType<typeof setTimeout>;clearTimeout(id:ReturnType<typeof setTimeout>):void}
interface Options {delaySeconds:number;document:{visibilityState:string};canOpen():boolean;open():boolean;clock?:Clock}
export function createNewsletterScheduler({delaySeconds,document,canOpen,open,clock={now:()=>Date.now(),setTimeout:(fn,ms)=>setTimeout(fn,ms),clearTimeout:id=>clearTimeout(id)}}:Options){
 let timer:ReturnType<typeof setTimeout>|undefined,elapsed=0,last=0,visible=false,running=false,finished=false;
 const clear=()=>{if(timer!==undefined)clock.clearTimeout(timer);timer=undefined;};
 function reconsider(){
  if(!running||finished)return;
  clear();const now=clock.now();if(visible)elapsed+=Math.max(0,now-last);last=now;visible=document.visibilityState==='visible';
  if(!visible)return;
  const remaining=delaySeconds*1000-elapsed;
  if(remaining>0){timer=clock.setTimeout(reconsider,remaining);return;}
  if(canOpen()){finished=true;open();}
 }
 return {start(){if(running||finished)return;running=true;last=clock.now();reconsider();},reconsider,stop(){running=false;finished=true;clear();}};
}
