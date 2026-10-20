import {fileURLToPath} from 'node:url';import {parseInitializeArgs} from './initialize/options.mjs';import {initializeProject} from './initialize/initialize.mjs';
try{
 const options=parseInitializeArgs(process.argv.slice(2));
 if(options.help)console.log('Create an independent local project: --preset neutral|professional-services|trades|accommodation|studio --name NAME --destination PATH [--languages en,el] [--default-language en|el] [--theme NAME] [--dry-run]. No installation, overwrite, provisioning or sending.');
 else{const result=await initializeProject({source:fileURLToPath(new URL('../',import.meta.url)),options,dryRun:options.dryRun});console.log(JSON.stringify(result,null,2));}
}catch(error){console.error(error.message);process.exitCode=1;}
