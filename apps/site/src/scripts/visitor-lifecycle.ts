interface VisitorModule {initVisitorExperience(root:HTMLElement):()=>void}
/** A cached document keeps its DOM and module state; restore enhancement on return. */
export function connectVisitorLifecycle(root:HTMLElement,events:EventTarget,load:()=>Promise<VisitorModule>){
 let generation=0,visible=true,disposed=false,stop:(()=>void)|undefined;
 function start(){const current=++generation;void load().then(module=>{if(disposed||!visible||generation!==current)return;stop=module.initVisitorExperience(root);}).catch(()=>{});}
 function hide(){visible=false;generation++;stop?.();stop=undefined;}
 function show(){if(disposed||visible)return;visible=true;start();}
 events.addEventListener('pagehide',hide);events.addEventListener('pageshow',show);start();
 return ()=>{if(disposed)return;disposed=true;hide();events.removeEventListener('pagehide',hide);events.removeEventListener('pageshow',show);};
}
