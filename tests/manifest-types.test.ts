import {it,expect} from 'vitest';import ts from 'typescript';import {readFileSync} from 'node:fs';import {resolve} from 'node:path';
it('type-checks Worker consumers with no published articles or enquiry contexts',()=>{
 const path=resolve('tsconfig.json');const config=ts.parseJsonConfigFileContent(ts.readConfigFile(path,ts.sys.readFile).config,ts.sys,process.cwd());
 const host=ts.createCompilerHost(config.options);const read=host.readFile.bind(host);host.readFile=file=>{
 if(file.replaceAll('\\','/').endsWith('/.generated/manifest.json')){const manifest=JSON.parse(readFileSync('.generated/manifest.json','utf8'));return JSON.stringify({...manifest,articles:[],enquiryContexts:[],offerings:[],routes:[]});}return read(file);
 };
 const program=ts.createProgram(config.fileNames,config.options,host);const errors=ts.getPreEmitDiagnostics(program).filter(d=>d.file?.fileName.replaceAll('\\','/').includes('/worker/'));
 expect(errors.map(d=>ts.flattenDiagnosticMessageText(d.messageText,' '))).toEqual([]);
},20000);
