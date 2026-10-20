import {it,expect,afterEach,vi} from 'vitest';
import {join} from 'node:path';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {ownedTempRoots} from './helpers/owned-temp-roots';
import {assertContactSettingsMutation,coerceContactSettingsVariables} from '../e2e/helpers/contact-social-native-admission';
import {createCmsSources} from '../e2e/helpers/cms-source-ownership';
import {createMediaOptimizationFixture} from '../e2e/helpers/media-optimization-fixture';
import {cleanupMediaOptimization} from '../e2e/helpers/media-optimization-cleanup';
const roots=ownedTempRoots('contact-native-fault-');
afterEach(({task})=>roots.cleanup(task.result?.state==='fail'));
const query='mutation Update($collection: String!, $relativePath: String!, $params: DocumentUpdateMutation!) { updateDocument(collection: $collection, relativePath: $relativePath, params: $params) { __typename } }';
const body=()=>({query,variables:{collection:'settings',relativePath:'site.json',params:{settings:{social:{instagram:'https://instagram.com/example'}}}}});
it('admits only the actual Settings update request',()=>expect(()=>assertContactSettingsMutation(body(),'content/settings/site.json')).not.toThrow());
for(const [name,alter] of Object.entries({target:(b:any):unknown=>b.variables.relativePath='other.json',collection:(b:any):unknown=>b.variables.collection='page',create:(b:any):unknown=>b.query=b.query.replaceAll('updateDocument','createDocument'),delete:(b:any):unknown=>b.query=b.query.replaceAll('updateDocument','deleteDocument'),multiple:(b:any):unknown=>b.query=b.query.replace('{ updateDocument','{ other: updateDocument(collection: $collection, relativePath: $relativePath, params: $params) { __typename } updateDocument'),literal:(b:any):unknown=>b.query=b.query.replace('collection: $collection','collection: "page"'),alias:(b:any):unknown=>b.query=b.query.replace('{ updateDocument','{ alias: updateDocument'),traversal:(b:any):unknown=>b.variables.relativePath='../site.json'}))it('refuses '+name+' before dispatch',()=>{const b=body();alter(b);const dispatch=vi.fn();expect(()=>{assertContactSettingsMutation(b,'content/settings/site.json');dispatch();}).toThrow();expect(dispatch).not.toHaveBeenCalled();});
it('preserves foreign bytes after restoration conflict',async()=>{const root=roots.create(),path=join(root,'site.json');writeFileSync(path,'{"original":true}');const owner=createCmsSources([path],join(root,'backup'));writeFileSync(path,'{"foreign":true}');await expect(owner.restore()).rejects.toThrow(/Concurrent edits/);expect(readFileSync(path,'utf8')).toBe('{"foreign":true}');});
it('failed child stop still attempts independent restoration and blocks regeneration',async()=>{const root=roots.create(),path=join(root,'site.json');writeFileSync(path,'{"original":true}');const owner=createCmsSources([path],join(root,'backup'));const regen=vi.fn(),restore=vi.fn(()=>owner.restore());let ledger:any;await expect(cleanupMediaOptimization({stops:[{id:'child',stop:()=>{throw Error('deliberate shutdown refusal');}}],restores:[{id:'settings',restore}],assertInputs:()=>expect(readFileSync(path,'utf8')).toBe('{"original":true}'),regenerate:[{id:'build',run:regen}],record:x=>{ledger=x;}})).rejects.toThrow();expect(restore).toHaveBeenCalledOnce();expect(regen).not.toHaveBeenCalled();expect(ledger.regeneration[0].status).toBe('skipped');});

it('rejects same-JSON foreign bytes before a native claim, revokes older claim and blocks regeneration',async()=>{
 const root=roots.create(),path=join(root,'site.json');writeFileSync(path,'{"social":{}}');
 const owner=createCmsSources([path],join(root,'backup'));
 const schema:any={collections:[{name:'settings',path:root,format:'json',fields:[{name:'social',type:'object',fields:[{name:'instagram',type:'string'}]}]}]};
 const request:any={collection:'settings',relativePath:'site.json',params:{settings:{social:{instagram:'https://instagram.com/example'}}}};
 const known='{"social":{"instagram":"https://instagram.com/example"}}';
 writeFileSync(path,known);await owner.captureNative(path,request,schema,()=>true,known);expect(owner.owns(path)).toBe(true);
 const foreign=JSON.stringify(JSON.parse(known),null,4)+'\n';writeFileSync(path,foreign);
 await expect(owner.captureNative(path,request,schema,()=>true,known)).rejects.toThrow(/Unexpected saved document bytes/);
 expect(owner.owns(path)).toBe(false);const regenerate=vi.fn();
 await expect(cleanupMediaOptimization({stops:[],restores:[{id:'settings',restore:()=>owner.restore()}],assertInputs:()=>{},regenerate:[{id:'build',run:regenerate}],record:()=>{}})).rejects.toThrow();
 expect(readFileSync(path,'utf8')).toBe(foreign);expect(regenerate).not.toHaveBeenCalled();
});

it('static known-byte fixture preserves foreign formatting and refuses regeneration',async()=>{
 const root=roots.create();mkdirSync(join(root,'content/settings'),{recursive:true});writeFileSync(join(root,'project.json'),'{}');const path=join(root,'content/settings/site.json');writeFileSync(path,'{"social":{}}');
 const fixture=createMediaOptimizationFixture({root,documents:['content/settings/site.json']});const known='{"social":{"facebook":"https://facebook.com/example"}}';fixture.replaceDocument('content/settings/site.json',known);
 const foreign=JSON.stringify(JSON.parse(known),null,4)+'\n';writeFileSync(path,foreign);const regenerate=vi.fn();
 expect(()=>fixture.assertInputs()).toThrow(/snapshot conflict/);await expect(fixture.cleanup({regenerate:[{id:'build',run:regenerate}]})).rejects.toThrow();expect(readFileSync(path,'utf8')).toBe(foreign);expect(regenerate).not.toHaveBeenCalled();
});

it('coerces raw Settings variable key order through the installed GraphQL input schema before exact serializer expectations',()=>{
 const raw=body();raw.variables.params.settings={navigation:['Home'],social:{instagram:'https://instagram.com/example'}} as any;
 const sdl='type Query { ok: Boolean } type Mutation { updateDocument(collection:String!,relativePath:String!,params:DocumentUpdateMutation!): String } input DocumentUpdateMutation { settings:SettingsInput } input SettingsInput { social:SocialInput navigation:[String] } input SocialInput { instagram:String }';
 const request=coerceContactSettingsVariables(raw,sdl);
 expect(Object.keys(request.params.settings)).toEqual(['social','navigation']);expect(request.params.settings).toEqual(raw.variables.params.settings);expect(Object.keys(raw.variables.params.settings)).toEqual(['navigation','social']);
});
