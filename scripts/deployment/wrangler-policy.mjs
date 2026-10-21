import {resolve} from 'node:path';
/** Guard the owned wrapper only. Raw Wrangler is outside this boundary. */
export function assertLocalWranglerArgs(args){
 const same=expected=>expected.length===args.length&&expected.every((value,index)=>value===args[index]);
 const config='wrangler.generated.json';
 if(same(['deploy','--dry-run','--config',config]))return;
 if(same(['d1','migrations','apply','DB','--local','--config',config]))return;
 if(args.length===10&&args[0]==='dev'&&args[1]==='--local'&&args[2]==='--ip'&&args[3]==='127.0.0.1'&&args[4]==='--port'&&/^\d+$/.test(args[5])&&Number(args[5])>=1&&Number(args[5])<=65535&&args[6]==='--inspector-port'&&args[7]==='0'&&args[8]==='--config'&&resolve(args[9])===resolve(config))return;
 throw Error('Remote or unsupported Wrangler operation blocked. Use deploy:prepare for a production plan; hosted release prerequisites are unresolved.');
}
