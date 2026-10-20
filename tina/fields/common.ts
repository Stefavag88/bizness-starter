import type { TinaField } from 'tinacms';
import { rich } from './rich-text';

const labels: Record<string, string> = {
  contentId: 'Content ID', slug: 'URL slug', seoDescription: 'Search engine description',
  authorId: 'Author content ID', offeringId: 'Related service content ID', articleId: 'Article content ID',
  businessName: 'Legal business name', privacyVersion: 'Privacy notice version',
  brand: 'Business identity', legal: 'Legal and privacy', contact: 'Contact details',
  social: 'Social channels', navigation: 'Main navigation', translations: 'Translations',
  meta: 'Page title and SEO', copy: 'Section content', link: 'Button or link', href: 'Destination URL',
  alt: 'Image description (alt text)', media: 'Shared image', src: 'Image',
  'rich-text': 'Text section', 'offering-list': 'Services list', 'people-list': 'People list',
  'article-list': 'Articles list', cta: 'Call to action', faq: 'Frequently asked questions',
  steps: 'Process steps', 'media-text': 'Image and text', gallery: 'Image gallery', hero: 'Hero',
};
export const editorLabel = (name: string): string => labels[name] || name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[-_]/g, ' ').replace(/^./, c => c.toUpperCase());
const descriptions: Record<string, string> = {
  contentId: 'Stable internal identifier used by links and related content. Keep it unchanged after the first save.',
  slug: 'URL segment for this entry, without a leading slash. Keep it unchanged after the first save.',
  seoDescription: 'A short plain-text summary for search engines, separate from the visible introduction.',
  authorId: 'Optional: enter the Content ID of an existing People entry, not its name or URL.',
  offeringId: 'Optional: enter the Content ID of an existing Offering, not its title or URL.',
  privacyVersion: 'Update this value when a material privacy notice change requires renewed consent.',
};
export const text=(name:string,hidden=false):TinaField=>({name,label:editorLabel(name),...(descriptions[name]?{description:descriptions[name]}:{}),type:'string',ui:hidden?{component:'hidden'}:undefined});
export const object=(name:string,fields:TinaField[],list=false):TinaField=>({name,label:editorLabel(name),type:'object',fields,list});
export const publication:TinaField[]=[{name:'status',label:'Publication status',description:'Draft entries stay hidden. Published entries appear only when their publication date allows it. Each language is published independently.',type:'string',options:[{value:'draft',label:'Draft — hidden'},{value:'published',label:'Published'}],required:true},{name:'publishAt',label:'Publication date',description:'Optional. A future date keeps published content hidden until a site rebuild after that date. This field does not schedule a rebuild.',type:'datetime'}];
export const meta=object('meta',[text('title'),text('seoDescription')]);
export const prose:TinaField[]=[...publication,text('title'),{...rich('description',true),label:'Short introduction',description:'Visible summary used in previews. Supports emphasis and links; use Main content for the full text.'},{...rich('body'),label:'Main content',description:'Full text with headings, lists, emphasis and links. Use H2 or H3 headings below the page title.'},text('seoDescription')];
export const link=object('link',[{...text('label'),label:'Link text'},text('href')]);
