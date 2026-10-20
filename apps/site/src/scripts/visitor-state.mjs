const day=86400000;
const empty=()=>({version:1,promptsAllowed:true,lastAutoShownAt:0,dismissedUntil:0,acceptedUntil:0});
export const visitorStorageKey=name=>`starter:${name}:visitor:v1`;
export function readVisitorState(storage,key,now){
 try{
  const raw=storage.getItem(key);if(raw===null)return {status:'empty',state:empty()};
  if(new TextEncoder().encode(raw).length>1024)throw Error('oversized');
  const state=JSON.parse(raw),keys=Object.keys(empty());
  if(!state||typeof state!=='object'||Array.isArray(state)||Object.keys(state).length!==keys.length||keys.some(k=>!Object.hasOwn(state,k))||state.version!==1||typeof state.promptsAllowed!=='boolean')throw Error('shape');
  for(const key of ['lastAutoShownAt','dismissedUntil','acceptedUntil'])if(!Number.isSafeInteger(state[key])||state[key]<0)throw Error('timestamp');
  if(state.lastAutoShownAt>now||state.dismissedUntil>now+180*day||state.acceptedUntil>now+365*day)throw Error('horizon');
  return {status:'valid',state};
 }catch(error){let status='invalid';try{storage.getItem(key);}catch{status='blocked';}return {status,state:empty()};}
}
export function canAutoPrompt(snapshot,policy,now){
 const s=snapshot.state;return ['empty','valid'].includes(snapshot.status)&&s.promptsAllowed&&s.dismissedUntil<=now&&s.acceptedUntil<=now&&(!s.lastAutoShownAt||now>=s.lastAutoShownAt+policy.dismissDays*day);
}
export function updateVisitorState(storage,key,change,policy,now){
 const latest=readVisitorState(storage,key,now),state={...latest.state};
 if(change==='autoShown'){state.lastAutoShownAt=now;state.dismissedUntil=now+policy.dismissDays*day;}
 else if(change==='dismissed')state.dismissedUntil=now+policy.dismissDays*day;
 else if(change==='accepted')state.acceptedUntil=now+policy.acceptedDays*day;
 else state.promptsAllowed=change.promptsAllowed;
 if(latest.status==='invalid'||latest.status==='blocked')return {...latest,state};
 try{storage.setItem(key,JSON.stringify(state));return {status:'valid',state};}catch{return {status:'blocked',state};}
}
export function resetVisitorState(storage,key,now){try{storage.removeItem(key);return readVisitorState(storage,key,now);}catch{return {status:'blocked',state:empty()};}}
