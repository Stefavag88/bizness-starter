import type { TinaField } from 'tinacms';
export const rich=(name:string,inline=false):TinaField=>({name,label:name==='body'?'Body':name==='notice'?'Legal notice':name==='answer'?'Answer':'Description',type:'rich-text',templates:[],overrides:{toolbar:inline?['bold','italic','link']:['heading','bold','italic','link','ul','ol','quote'],headingLevels:inline?[]:['h2','h3']}});
// New native rich fields require ASTs; Tina's serializer omits string inputs.
export const nativeRichText=(text='')=>({type:'root',children:[{type:'p',children:[{type:'text',text}]}]});
