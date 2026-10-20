export function isSafeLink(value:unknown):boolean;
export function renderRichText(body:string,options?:{links?:boolean;resolveHref?:(href:string)=>string}):string;
export function renderInlineRichText(body:string,options?:{links?:boolean;resolveHref?:(href:string)=>string}):string;
export function plainText(body:string,limit?:number):string;

export function isSafeMarkdown(value:unknown,inline?:boolean):boolean;
