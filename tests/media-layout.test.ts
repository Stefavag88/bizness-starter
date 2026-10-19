import {describe,it,expect} from 'vitest';
import {imageSizes,type ImageLayout} from '../packages/media/layout.mjs';
// Evaluate emitted sizes at a 16px root; expected widths below are hand-derived from CSS.
function slot(sizes:string,viewport:number):number {
 let depth=0,start=0;const parts:string[]=[];
 for(let i=0;i<sizes.length;i++){if(sizes[i]==='(')depth++;if(sizes[i]===')')depth--;if(sizes[i]===','&&depth===0){parts.push(sizes.slice(start,i).trim());start=i+1;}}
 parts.push(sizes.slice(start).trim());
 for(const part of parts){const match=part.match(/^\(min-width: ([\d.]+)(px|rem)\) (.+)$/);if(match&&viewport<Number(match[1])*(match[2]==='rem'?16:1))continue;
 const expr=(match?match[3]:part).replace(/([\d.]+)rem/g,(_,n)=>String(Number(n)*16)).replace(/([\d.]+)vw/g,(_,n)=>String(Number(n)*viewport/100)).replace(/calc\(/g,'(').replace(/min\(/g,'Math.min(').replace(/clamp\(/g,'clamp(');
 return Function('clamp',`return ${expr}`)((lo:number,v:number,hi:number)=>Math.max(lo,Math.min(v,hi)));
 }throw Error('No matching sizes entry');
}
describe('CSS slot geometry',()=>{
 it.each(['gallery','room-card'] as ImageLayout[])('%s caps auto-fit columns by actual item count',role=>{
  for(const [vw,one,two,three] of [[375,335,335,335],[626.08,575.9936,575.9936,575.9936],[626.10,576.012,272.006,272.006],[640,588.8,278.4,278.4],[768,706.56,337.28,337.28],[956.51,879.9892,423.9946,423.9946],[956.53,880.0076,424.0038,272.002533],[1440,1056,512,330.666667]]){
   for(const [count,want] of [[1,one],[2,two],[3,three],[4,three]])expect(slot(imageSizes(role,count),vw)).toBeCloseTo(want,3);
  }
 });
 it.each(['gallery-featured-lead','gallery-featured-item'] as ImageLayout[])('%s uses auto-fit below768 and explicit featured geometry above',role=>{
  for(const count of [1,2,3,4]){
   for(const [vw,want] of [[375,335],[626.08,575.9936],[626.10,count===1?576.012:272.006],[640,count===1?588.8:278.4],[767.99,count===1?706.5508:337.2754],[768,role==='gallery-featured-lead'?706.56:337.28],[768.01,role==='gallery-featured-lead'?706.5692:337.2846],[1440,role==='gallery-featured-lead'?1056:512]])expect(slot(imageSizes(role,count),vw)).toBeCloseTo(want,3);
  }
 });
 it('matches media/text split and narrower Room detail container',()=>{
  for(const [vw,media,detail] of [[375,335,335],[640,588.8,588.8],[767.99,706.5508,706.5508],[768,337.28,706.56],[1440,512,832]]){
   expect(slot(imageSizes('media-text',1),vw)).toBeCloseTo(media,3);expect(slot(imageSizes('room-detail',1),vw)).toBeCloseTo(detail,3);
  }
 });
});
