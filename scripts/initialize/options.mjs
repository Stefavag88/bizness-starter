import {parseArgs} from 'node:util';
export function parseInitializeArgs(argv){
 const {values,tokens}=parseArgs({args:argv,strict:true,allowPositionals:false,tokens:true,options:{help:{type:'boolean',short:'h'},'dry-run':{type:'boolean'},preset:{type:'string'},name:{type:'string'},destination:{type:'string'},languages:{type:'string'},'default-language':{type:'string'},theme:{type:'string'}}});
 const seen=new Set();for(const token of tokens)if(token.kind==='option'){if(seen.has(token.name))throw Error('Duplicate option: '+token.name);seen.add(token.name);}
 if(values.help)return {help:true,dryRun:false};
 if(!values.name||!values.destination)throw Error('--name and --destination are required');
 if(values.destination.split(/[\\/]/).includes('..'))throw Error('Destination traversal is not accepted');
 return {help:false,dryRun:Boolean(values['dry-run']),preset:values.preset||'neutral',name:values.name,destination:values.destination,languages:(values.languages||'en,el').split(','),defaultLanguage:values['default-language']||'en',...(values.theme?{theme:values.theme}:{})};
}
const quote=value=>"'"+String(value).replaceAll("'","''")+"'";
export function formatInitializeCommand(options){
 const parts=['pnpm create:project','--preset '+quote(options.preset),'--name '+quote(options.name),'--destination '+quote(options.destination),'--languages '+quote(options.languages.join(',')),'--default-language '+quote(options.defaultLanguage)];
 if(options.theme)parts.push('--theme '+quote(options.theme));return parts.join(' ');
}
