import {escapeHtml} from '../../../../packages/contracts';
import {description,project} from './content';
import type {LocalizedContent} from '../../../../packages/content/types';
export function rss(content:LocalizedContent){
 const xml=(s:string)=>escapeHtml(s);
 return '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>'+xml(content.settings.brand.name)+'</title><link>'+project.siteUrl+'/'+content.locale+'</link><description>'+xml(content.settings.brand.tagline)+'</description><language>'+content.locale+'</language>'+content.articles.map(a=>'<item><guid isPermaLink="true">'+project.siteUrl+a.path+'</guid><link>'+project.siteUrl+a.path+'</link><title>'+xml(a.title)+'</title><description>'+xml(description(a))+'</description><pubDate>'+new Date(a.publishAt).toUTCString()+'</pubDate></item>').join('')+'</channel></rss>';
}
