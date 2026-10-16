export interface Env { ENVIRONMENT:string; PROFILE:string; SENDING_ENABLED:string; MARKETING_ENABLED:string }
export default {
  async fetch(request:Request,_env:Env):Promise<Response> {
    if (new URL(request.url).pathname === '/api/health' && request.method === 'GET') return Response.json({ok:true,service:'business-starter-v2'});
    return new Response('Not found',{status:404});
  },
} satisfies ExportedHandler<Env>;
