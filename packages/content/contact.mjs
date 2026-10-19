import {z} from 'zod';
import {isSafeLink} from './rich-text.mjs';

export const SOCIAL_CHANNELS=Object.freeze(['instagram','linkedin','facebook','whatsapp']);
const clearedString=z.preprocess(value=>value==null?'':value,z.string().trim());
function platformUrl(platform){
 return clearedString.pipe(z.string().max(2048).refine(value=>{
  if(!value)return true;
  if(!isSafeLink(value))return false;
  try{
   const url=new URL(value);
   return url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&
    (url.hostname===platform+'.com'||url.hostname.endsWith('.'+platform+'.com'));
  }catch{return false;}
 },'Use a safe HTTPS URL on '+platform+'.com'));
}
export const socialSettingsSchema=z.preprocess(value=>value==null?{}:value,z.strictObject({
 instagram:platformUrl('instagram'),linkedin:platformUrl('linkedin'),facebook:platformUrl('facebook'),
 whatsapp:clearedString.pipe(z.string().refine(value=>!value||/^\+[1-9][0-9]{7,14}$/.test(value),'Use an international number such as +302101234567')),
 showInHeader:z.preprocess(value=>value==null?false:value,z.boolean()),
}));

export function phoneHref(value){
 if(!/^\+?[0-9 ().-]+$/.test(value.replace(/^ +/,'')))return undefined;
 const number=value.replace(/[ ().-]/g,'');
 if(!/^\+?[0-9]{3,20}$/.test(number))return undefined;
 const href='tel:'+number;
 return isSafeLink(href)?href:undefined;
}

export function contactChannels(settings,locale){
 const direct=[],social=[];
 const phone=settings.contact.phone;
 const phoneLink=phoneHref(phone);
 if(phoneLink)direct.push({id:'phone',label:phone,href:phoneLink,external:false});
 const email='mailto:'+encodeURIComponent(settings.contact.email);
 if(isSafeLink(email))direct.push({id:'email',label:settings.contact.email,href:email,external:false});
 const labels={instagram:'Instagram',linkedin:'LinkedIn',facebook:'Facebook',whatsapp:'WhatsApp'};
 for(const id of SOCIAL_CHANNELS){
  const value=settings.social[id];
  if(!value)continue;
  const href=id==='whatsapp'?'https://wa.me/'+value.slice(1):value;
  if(isSafeLink(href))social.push({id,label:labels[id],href,external:true});
 }
 return {direct,social,...(phone.trim()&&!phoneLink?{phoneText:phone}:{}),...(settings.contact.address.trim()?{address:settings.contact.address}:{})};
}
