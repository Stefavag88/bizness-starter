import {vi} from 'vitest';
export function scene(count=1){
 const listeners=new Map<string,Function>();
 const target=(top=1200)=>({top,parentElement:null as any,group:null as any,children:[] as any[],hidden:false,
  getBoundingClientRect(){return {top:this.top,bottom:this.top+50,left:0,right:100};},
  contains(other:any){return other===this||this.children.includes(other);},
  closest(selector:string){return selector==='[data-motion-group]'?this.group:selector==='[hidden]'&&this.hidden?this:null;},
  animate:vi.fn(()=>({cancel:vi.fn(),finished:new Promise(()=>{})})),
 });
 const targets=Array.from({length:count},()=>target());
 const group={querySelectorAll:()=>targets};targets.forEach(t=>t.group=group);
 let callback:Function=()=>{};
 const observer={observe:vi.fn(),unobserve:vi.fn(),disconnect:vi.fn()};
 const media={matches:false,addEventListener:vi.fn((_:string,cb:Function)=>listeners.set('media',cb)),removeEventListener:vi.fn()};
 const values:Record<string,string>={'--motion-duration':'600ms','--motion-distance':'18px','--motion-stagger':'70ms','--motion-max-delay':'300ms','--motion-ease':'ease-out'};
 const html={...target(),dataset:{motion:'on'}};
 const win={innerHeight:800,innerWidth:1200,location:{hash:''},Element:{prototype:{animate:()=>{}}},
  matchMedia:()=>media,getComputedStyle:vi.fn((el:any)=>({getPropertyValue:(key:string)=>values[key]||'',translate:el.translation||'none'})),
  IntersectionObserver:class {constructor(cb:Function){callback=cb;}observe=observer.observe;unobserve=observer.unobserve;disconnect=observer.disconnect;},
  addEventListener:vi.fn((key:string,cb:Function)=>listeners.set(key,cb)),removeEventListener:vi.fn(),
 };
 const doc={nodeType:9,documentElement:html,defaultView:win,activeElement:null as any,
  querySelectorAll:()=>targets,getElementById:(id:string)=>id==='destination'?targets[0]:null,
  addEventListener:vi.fn((key:string,cb:Function)=>listeners.set(key,cb)),removeEventListener:vi.fn(),
 };
 return {root:doc as any,targets,observer,win,media,values,listeners,fire:(...items:any[])=>callback(items.map(target=>({target,isIntersecting:true}))),focus:(el:any)=>{doc.activeElement=el;listeners.get('focusin')?.({target:el});},hash:(value:string)=>{win.location.hash=value;listeners.get('hashchange')?.();}};
}
