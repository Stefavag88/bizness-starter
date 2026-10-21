import {readFileSync,writeFileSync} from 'node:fs';import {resolve} from 'node:path';
import {calculateCapacity} from '../packages/runtime-capacity/model.mjs';import {resolveRuntimePolicy} from '../packages/config/runtime-budgets.mjs';
try{const args=process.argv.slice(2),options={};for(let i=0;i<args.length;i+=2){if(!['--workload','--evidence','--output'].includes(args[i])||!args[i+1])throw Error('Use --workload FILE --evidence FILE --output NEW_FILE');options[args[i].slice(2)]=args[i+1];}
 if(!options.workload||!options.evidence||!options.output)throw Error('All three file arguments are required');
 if([options.workload,options.evidence].some(f=>resolve(f)===resolve(options.output)))throw Error('Output cannot replace an input');
 const workload=JSON.parse(readFileSync(options.workload,'utf8')),evidence=JSON.parse(readFileSync(options.evidence,'utf8'));
 const result=calculateCapacity(workload,evidence,resolveRuntimePolicy(workload.profile));writeFileSync(options.output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({qualification:result.qualification,output:options.output,missingMeasurements:result.missingMeasurements}));
}catch(error){console.error(error.message);process.exitCode=1;}
