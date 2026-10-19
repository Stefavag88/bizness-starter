import {verifyMediaOptimization} from './media-optimization-acceptance.mjs';
const args=process.argv.slice(2);if(args[0]==='--')args.shift();
if(args.length>1||args[0]&&!['--pure','--smoke','--static','--native'].includes(args[0]))throw Error('Usage: test:media-optimization [--pure|--smoke|--static|--native]');
const result=await verifyMediaOptimization({phase:args[0]?.slice(2)??'pure'});
console.log('Media acceptance evidence: '+result.directory);
