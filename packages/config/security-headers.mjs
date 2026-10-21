const common={
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin',
 'Permissions-Policy':'camera=(), microphone=(), geolocation=()',
};
export function publicAssetHeaders(turnstile=false){
 const challenge=turnstile?' https://challenges.cloudflare.com':'';
 const policy=`default-src 'self'; script-src 'self'${challenge}; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self'; ${turnstile?'frame-src https://challenges.cloudflare.com; ':''}base-uri 'self'; form-action 'self'; frame-ancestors 'none'`;
 return '/*\n'+Object.entries({...common,'Content-Security-Policy':policy}).map(([name,value])=>'  '+name+': '+value).join('\n')+'\n';
}
export function cmsResponse(response,env){
 let origins=[];
 if(env.ENVIRONMENT==='local')try{const parsed=JSON.parse(env.CMS_LOCAL_ORIGINS??'[]');if(Array.isArray(parsed))origins=parsed.filter(value=>typeof value==='string'&&/^http:\/\/(127\.0\.0\.1|localhost|\[::1\]):[0-9]{1,5}$/.test(value)&&Number(new URL(value).port)>0&&Number(new URL(value).port)<=65535);}catch{}
 const localScripts=origins.length?' '+origins.join(' '):'';
 const localConnections=origins.length?' '+[...origins,...origins.map(value=>value.replace('http:','ws:'))].join(' '):'';
 const policy=`default-src 'self'; script-src 'self' 'unsafe-inline' blob:${localScripts}; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data: https://*.tina.io; connect-src 'self'${localConnections} https://*.tina.io https://*.tinajs.io; frame-src https://*.tina.io; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`;
 const result=new Response(response.body,response);
 for(const [name,value] of Object.entries(common))result.headers.set(name,value);
 // Replace, never append: inherited static policies would otherwise intersect.
 result.headers.set('Content-Security-Policy',policy);result.headers.delete('Content-Security-Policy-Report-Only');
 result.headers.set('X-Robots-Tag','noindex, nofollow');result.headers.set('Cache-Control','no-store');
 return result;
}
