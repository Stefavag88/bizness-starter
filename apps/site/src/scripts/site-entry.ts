// This tiny bootstrap is shared. Disabled sites never request the controller chunk.
if (document.documentElement.dataset.motion === 'on') {
 let stop:(()=>void)|undefined;
 let ended=false;
 window.addEventListener('pagehide',()=>{ended=true;stop?.();},{once:true});
 void import('./motion').then(({initMotion})=>{if(!ended)stop=initMotion(document);}).catch(()=>{});
}

const visitorRoot=document.querySelector<HTMLElement>('[data-visitor-experience]');
if(visitorRoot){let stop:(()=>void)|undefined;let ended=false;window.addEventListener('pagehide',()=>{ended=true;stop?.();},{once:true});void import('./visitor-experience').then(({initVisitorExperience})=>{if(!ended)stop=initVisitorExperience(visitorRoot);}).catch(()=>{});}
