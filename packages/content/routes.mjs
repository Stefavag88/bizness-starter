export function publicRoutes(content) {
 const routes=[
  ...content.pages.map(record=>({kind:'page',record})),
  ...content.offerings.map(record=>({kind:'offering',record})),
  ...content.articles.map(record=>({kind:'article',record})),
  ...content.people.map(record=>({kind:'person',record})),
  ...Object.entries(content.domains??{}).flatMap(([domain,records])=>records.map(record=>({kind:'domain',domain,record}))),
 ].map(({kind,domain,record})=>({kind,...(domain?{domain}:{}),contentId:record.contentId,locale:content.locale,path:record.path,alternates:structuredClone(record.alternates)}));
 const seen=new Map();
 for(const route of routes) {
  if(seen.has(route.path))throw new Error('Duplicate active route '+route.path+' for '+seen.get(route.path)+' and '+route.contentId);
  seen.set(route.path,route.contentId);
 }
 return routes;
}
