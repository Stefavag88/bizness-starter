import type {LocalizedContent} from './types';
export interface EnquiryContext {id:string;kind:string;title:string;path:string}
export function getEnquiryContexts(content:LocalizedContent):EnquiryContext[];
export function getAcceptedEnquiryContexts(contents:readonly LocalizedContent[]):{id:string;kind:string}[];
