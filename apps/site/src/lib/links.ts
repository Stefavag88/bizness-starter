interface LinkRoute {path:string;alternates:{locale:string;path:string}[]}
/** Resolve known internal destinations; leave relative and external URL semantics intact. */
export function resolveContentLink(href:string,locale:string,routes:LinkRoute[],siteUrl:string){
 if((!href.startsWith('/')&&!/^https?:\/\//i.test(href))||href.startsWith('//'))return href;
 const url=new URL(href,siteUrl);if(url.origin!==new URL(siteUrl).origin)return href;
 if(url.pathname==='/')return '/'+locale+url.search+url.hash;
 const route=routes.find(r=>r.path===url.pathname)||routes.find(r=>'/'+r.path.split('/').slice(2).join('/')===url.pathname);
 const alternate=route?.alternates.find(a=>a.locale===locale);
 return (alternate?.path||url.pathname)+url.search+url.hash;
}
