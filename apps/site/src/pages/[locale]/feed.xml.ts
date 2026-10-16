import type {APIRoute} from 'astro';
import {contents} from '../../lib/content';
import {rss} from '../../lib/feed';
export function getStaticPaths(){return contents.filter(c=>c.feedPath).map(content=>({params:{locale:content.locale},props:{content}}));}
export const GET:APIRoute=({props})=>new Response(rss(props.content),{headers:{'Content-Type':'application/rss+xml; charset=utf-8'}});
