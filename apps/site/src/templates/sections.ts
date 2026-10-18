import RoomList from './domains/rooms/RoomList.astro';
import MediaText from './sections/MediaText.astro';
import Gallery from './sections/Gallery.astro';
import Faq from './sections/Faq.astro';
import Steps from './sections/Steps.astro';
import Hero from './sections/Hero.astro';
import RichText from './sections/RichText.astro';
import OfferingList from './sections/OfferingList.astro';
import PeopleList from './sections/PeopleList.astro';
import ArticleList from './sections/ArticleList.astro';
import Cta from './sections/Cta.astro';
import {rendererKey} from './section-registry';
export const sectionRenderers={'room-list':RoomList,'media-text':MediaText,gallery:Gallery,faq:Faq,steps:Steps,hero:Hero,'rich-text':RichText,'offering-list':OfferingList,'people-list':PeopleList,'article-list':ArticleList,cta:Cta} satisfies Record<keyof typeof import('./section-registry').sectionRegistry,unknown>;
export function sectionRenderer(type:string,variant:string){return sectionRenderers[rendererKey(type,variant)];}
