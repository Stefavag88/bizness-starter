import {describe,expect,it} from 'vitest';
import {settingsSchema} from '../packages/content/schemas.mjs';
import {normalizeSettingsDocument} from '../packages/content/documents.mjs';
import {localizeContent} from '../packages/content/localize.mjs';
import {fixture,normalizedSettings,project,settingsDocument} from './fixtures/content/factory';
import {contactChannels,phoneHref} from '../packages/content/contact.mjs';
import {readContent} from '../packages/content/read.mjs';

const emptySocial={instagram:'',linkedin:'',facebook:'',whatsapp:'',showInHeader:false};

describe('shared social settings',()=>{
 it.each([undefined,null,{}, {instagram:null,linkedin:null,facebook:null,whatsapp:null,showInHeader:null}, {instagram:'  ',linkedin:'',facebook:'\t',whatsapp:'\n'}])('normalizes native clear state %j',social=>{
  expect(settingsSchema.parse({...normalizedSettings(),social}).social).toEqual(emptySocial);
 });
 it.each([true,false])('accepts actual header boolean %s',showInHeader=>{
  expect(settingsSchema.parse({...normalizedSettings(),social:{showInHeader}}).social.showInHeader).toBe(showInHeader);
 });
 it.each([{showInHeader:'false'},{unknown:''}])('rejects invalid social fields %j',social=>{
  expect(settingsSchema.safeParse({...normalizedSettings(),social}).success).toBe(false);
 });
 it('rejects translated social data',()=>{
  const settings:any=normalizedSettings();settings.translations.el.social={instagram:''};
  expect(settingsSchema.safeParse(settings).success).toBe(false);
 });
 it.each([undefined,null])('normalizes cleared optional phone/address %j',clear=>{
  const settings:any=normalizedSettings();settings.contact.phone=clear;settings.contact.address=clear;settings.translations.el.contact.address=clear;
  const parsed=settingsSchema.parse(settings);
  expect(parsed.contact).toEqual({email:'hello@example.com',phone:'',address:''});
  expect(parsed.translations.el.contact.address).toBe('');
 });
 it('preserves arbitrary existing phone display text and its length bound',()=>{
  const settings=normalizedSettings();settings.contact.phone='Reception ext 2';
  expect(settingsSchema.parse(settings).contact.phone).toBe('Reception ext 2');
  settings.contact.phone='1'.repeat(101);expect(settingsSchema.safeParse(settings).success).toBe(false);
 });
 it('parses an existing document without inserting defaults into input',()=>{
  const raw=settingsDocument();delete raw.social;const original=structuredClone(raw);
  expect(normalizeSettingsDocument(raw).social).toEqual(emptySocial);expect(raw).toEqual(original);
 });
 it('retains detached equal shared settings in both locales',()=>{
  const {root,write}=fixture();const raw=settingsDocument();raw.social={instagram:' https://www.instagram.com/example?view=1#profile ',linkedin:'',facebook:'',whatsapp:'+302101234567',showInHeader:true};write('settings/site.json',raw);
  const source=readContent(root,project);const before=structuredClone(source);
  const en=localizeContent(source,'en',project),el=localizeContent(source,'el',project);
  const want={instagram:'https://www.instagram.com/example?view=1#profile',linkedin:'',facebook:'',whatsapp:'+302101234567',showInHeader:true};
  expect(en.settings.social).toEqual(want);expect(el.settings.social).toEqual(want);
  en.settings.social.instagram='';expect(el.settings.social).toEqual(want);expect(source).toEqual(before);
 });
});

describe('platform destination validation',()=>{
 const platforms=['instagram','linkedin','facebook'] as const;
 for(const platform of platforms){
  it.each([`https://${platform}.com`,`https://www.${platform}.com/example?view=1#profile`,`https://gr.${platform}.com/a%20b`,`https://${platform}.com:443/profile`])(`accepts ${platform} destination %s`,value=>{
   const social:any={[platform]:` ${value} `};expect(settingsSchema.parse({...normalizedSettings(),social}).social[platform]).toBe(value);
  });
  it.each([`https://${platform}.com.evil.test`,`https://evil${platform}.com`,`http://${platform}.com`,`//${platform}.com`,`https://user@${platform}.com`,`https://${platform}.com:8443`,`javascript:alert(1)`,`https://${platform}.com/%0a`,`https://${platform}.com/%255c`,`https://${platform}.com/\\evil`,`https://${platform}.com/%00`,`https://${platform}.com/${'x'.repeat(2048)}`,...platforms.filter(other=>other!==platform).map(other=>`https://${other}.com/example`)])(`rejects ${platform} destination %s`,value=>{
   const result=settingsSchema.safeParse({...normalizedSettings(),social:{[platform]:value}});expect(result.success).toBe(false);
   if(!result.success)expect(result.error.issues.some(issue=>issue.path.join('.')===`social.${platform}`)).toBe(true);
  });
 }
 it.each(['+12345678','+123456789012345'])('accepts international WhatsApp boundary %s',whatsapp=>{
  expect(settingsSchema.parse({...normalizedSettings(),social:{whatsapp}}).social.whatsapp).toBe(whatsapp);
 });
 it.each(['2101234567','https://wa.me/302101234567','+30 2101234567','+012345678','+1234567','+1234567890123456',12345678])('rejects invalid WhatsApp value %s',whatsapp=>{
  expect(settingsSchema.safeParse({...normalizedSettings(),social:{whatsapp}}).success).toBe(false);
 });
});

describe('contact channel projection',()=>{
 it.each([
  ['+30 (210) 123-4567','tel:+302101234567'],[' +30 (210) 123-4567 ','tel:+302101234567'],['123','tel:123'],['1'.repeat(20),'tel:'+'1'.repeat(20)],[' (123).45-67 ','tel:1234567'],
  ['',undefined],['   ',undefined],['Reception ext 2',undefined],['12',undefined],['1'.repeat(21),undefined],['12+345',undefined],['++123',undefined],['１２３',undefined],['123\n456',undefined],['123/456',undefined],
 ])('projects phone %j to %s',async(value,want)=>{
  expect(phoneHref(value)).toBe(want);
 });
 it('orders and safely projects all channels without mutating settings',async()=>{
  
  const settings={...normalizedSettings(),contact:{email:'hello?team#desk@example.com',phone:'+30 (210) 123-4567',address:'Studio\nAthens'},social:{instagram:'https://instagram.com/example',linkedin:'https://www.linkedin.com/company/example',facebook:'https://gr.facebook.com/example',whatsapp:'+302101234567',showInHeader:false}};
  const before=structuredClone(settings);const actual=contactChannels(settings,'el');
  expect(actual).toEqual({direct:[{id:'phone',label:'+30 (210) 123-4567',href:'tel:+302101234567',external:false},{id:'email',label:'hello?team#desk@example.com',href:'mailto:hello%3Fteam%23desk%40example.com',external:false}],social:[{id:'instagram',label:'Instagram',href:'https://instagram.com/example',external:true},{id:'linkedin',label:'LinkedIn',href:'https://www.linkedin.com/company/example',external:true},{id:'facebook',label:'Facebook',href:'https://gr.facebook.com/example',external:true},{id:'whatsapp',label:'WhatsApp',href:'https://wa.me/302101234567',external:true}],address:'Studio\nAthens'});
  expect(actual.social.map((link:any)=>link.id)).toEqual(['instagram','linkedin','facebook','whatsapp']);
  expect(settings).toEqual(before);actual.direct[0].label='changed';expect(settings).toEqual(before);
 });
 it.each(['','   '])('omits blank phone %j and empty groups',async phone=>{
  const settings=settingsSchema.parse({...normalizedSettings(),contact:{email:'hello@example.com',phone,address:'   '}});
  expect(contactChannels(settings,'en')).toEqual({direct:[{id:'email',label:'hello@example.com',href:'mailto:hello%40example.com',external:false}],social:[]});
 });
 it('keeps unsupported phone display text without inventing a destination',async()=>{
  const settings=settingsSchema.parse({...normalizedSettings(),contact:{email:'hello@example.com',phone:'Reception ext 2',address:''}});
  expect(contactChannels(settings,'en')).toEqual({direct:[{id:'email',label:'hello@example.com',href:'mailto:hello%40example.com',external:false}],social:[],phoneText:'Reception ext 2'});
 });
});

it.each([
 ['hello+team@example.com','mailto:hello%2Bteam%40example.com'],
 ['hello?subject=x#desk@example.com','mailto:hello%3Fsubject%3Dx%23desk%40example.com'],
])('encodes the entire mailbox %s without introducing URI parameters', (email,href)=>{
 const settings={...normalizedSettings(),contact:{email,phone:'',address:''}};
 expect(contactChannels(settings,'en').direct).toEqual([{id:'email',label:email,href,external:false}]);
});