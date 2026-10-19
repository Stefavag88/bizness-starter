import {fileURLToPath} from 'node:url';
import {beginMediaSession,endMediaSession} from '../../../../packages/media/session.mjs';
/** Policy is supplied only by the parsed developer project configuration. */
export default function mediaIntegration({root,policy}){
 let owned,command;
 const close=async()=>{if(owned){try{await endMediaSession(root);}finally{owned=undefined;}}};
 return {name:'static-demanded-media',hooks:{
  'astro:config:setup':options=>{command=options.command;},
  'astro:build:start':()=>{owned=beginMediaSession({root,policy,mode:'build'});},
  'astro:build:done':async({dir})=>{try{await owned.publish(fileURLToPath(dir));}finally{await close();}},
  'astro:server:setup':({server})=>{
   // Astro can create a Vite container during builds; it is not a dev owner.
   if(command==='build'||server.config?.mode==='test')return;
   owned=beginMediaSession({root,policy,mode:'dev'});const session=owned;
   server.middlewares.use(async(req,res,next)=>{
    if(!req.url?.startsWith('/_media/'))return next();
    if(req.method!=='GET'&&req.method!=='HEAD'){res.statusCode=405;res.setHeader('Allow','GET, HEAD');return res.end();}
    try {
     const asset=await session.asset(req.url);
     if(!asset){res.statusCode=404;return res.end();}
     res.statusCode=200;res.setHeader('Content-Type',asset.contentType);res.setHeader('Content-Length',String(asset.bytes.length));res.setHeader('Cache-Control','public, max-age=31536000, immutable');res.end(req.method==='HEAD'?undefined:asset.bytes);
    }catch(error){next(error);}
   });
  },
  'astro:server:done':close,
 }};
}
