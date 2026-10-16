import type { TinaField } from 'tinacms';
export const rich=(name:string,inline=false):TinaField=>({name,label:name==='body'?'Body':name==='notice'?'Legal notice':'Description',type:'rich-text',templates:[],overrides:{toolbar:inline?['bold','italic','link']:['heading','bold','italic','link','ul','ol','quote'],headingLevels:inline?[]:['h2','h3']}});
