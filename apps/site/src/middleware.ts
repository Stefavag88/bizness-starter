import {defineMiddleware} from 'astro:middleware';
import {project} from './lib/content';
// Development uses Astro rather than the asset Worker; preserve the same localized 404 contract.
export const onRequest=defineMiddleware(async(context,next)=>{
 const response=await next();const locale=context.url.pathname.split('/')[1];
 if(response.status!==404||!project.languages.some(l=>l.code===locale))return response;
 const localized=await context.rewrite('/'+locale+'/404');
 return new Response(localized.body,{status:404,headers:{...Object.fromEntries(localized.headers),'X-Robots-Tag':'noindex'}});
});
