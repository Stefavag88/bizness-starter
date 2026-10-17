import type {LocalizedContent,LocalizedSection} from '../../../../../packages/content/types';
/** Presentation-only fixtures. All destinations are available localized pages. */
export function createShowcaseSamples(input:LocalizedContent):{locale:string;sections:LocalizedSection[];content:LocalizedContent}{
 const content=structuredClone(input);const locale=input.locale;const el=locale==='el';
 const path=input.pages.find(p=>p._template==='contact')!.path;
 const text=el?'Σαφές κείμενο με **έμφαση** και χρήσιμες πληροφορίες.':'Clear copy with **emphasis** and useful information.';
 const link={label:el?'Επικοινωνία':'Contact',href:path};
 const sections:LocalizedSection[]=[
  {_template:'hero',copy:{title:el?'Μια σαφής εισαγωγή':'A clear introduction',description:text,link}},
  {_template:'rich-text',copy:{title:el?'Κείμενο και ιεραρχία':'Text and hierarchy',body:el?'### Λεπτομέρειες\n\n**Έντονα**, *πλάγια* και [επικοινωνία]('+path+').\n\n- Πρώτο στοιχείο\n- Δεύτερο στοιχείο':'### Details\n\n**Strong**, *emphasis* and [contact]('+path+').\n\n- First item\n- Second item'}},
  {_template:'offering-list',copy:{title:el?'Δείγμα OfferingList':'OfferingList example',description:text}},
  {_template:'people-list',copy:{title:el?'Δείγμα PeopleList':'PeopleList example',description:text}},
  {_template:'article-list',copy:{title:el?'Συνθετικό δείγμα ArticleList':'Synthetic ArticleList example',description:el?'Δείγμα παρουσίασης με σύνδεσμο επικοινωνίας· δεν αποτελεί δημοσιευμένο άρθρο.':'Presentation fixture linked to Contact; this is not a published article.'}},
  {_template:'cta',copy:{title:el?'Το επόμενο βήμα':'The next step',description:text,link}},
 ].map((s,index)=>({...s,id:`showcase-${locale}-${index}-${s._template}`,variant:'default',enabled:true,appearance:{surface:index%2?'muted':'default'}})) as LocalizedSection[];
 const base={contentId:`showcase-${locale}-card`,slug:'showcase',status:'published' as const,title:el?'Δείγμα κάρτας':'Sample card',description:text,body:'',seoDescription:'',path,alternates:[]};
 content.offerings=[{...base}];content.people=[{...base,role:el?'Οδηγός':'Guide'}];content.articles=[{...base,publishAt:'2026-01-01T09:00:00Z'}];
 return {locale,sections,content};
}
