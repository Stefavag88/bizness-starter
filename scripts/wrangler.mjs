import {assertLocalWranglerArgs} from './deployment/wrangler-policy.mjs';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
assertLocalWranglerArgs(process.argv.slice(2));
const child = spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js',...process.argv.slice(2)],{stdio:'inherit',env:{...process.env,XDG_CONFIG_HOME:resolve('.wrangler/config'),WRANGLER_LOG_PATH:resolve('.wrangler/logs'),WRANGLER_SEND_METRICS:'false'}});
child.on('error',error=>{ console.error(error.message); process.exitCode=1; });
child.on('exit',(code,signal)=>{ process.exitCode=code ?? (signal ? 1 : 0); });
for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>child.kill(signal));
