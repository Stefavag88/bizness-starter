import baseline from './neutral-data.json' with {type:'json'};
const pair=(en,el)=>({en,el});
const intro=pair('Illustrative sample content. Replace these details before publication.','Ενδεικτικό περιεχόμενο. Αντικαταστήστε τα στοιχεία πριν τη δημοσίευση.');
function section(type,id,title,extra={}){
 const common={id,_template:type,variant:'default',enabled:true,appearance:{surface:'default'}};
 const copy=language=>({id,_template:type,title:title[language],...(['rich-text','media-text'].includes(type)?{body:intro[language]}:{description:intro[language]}),...(extra.copy?.(language)||{})});
 return {reference:{...common,...extra.reference},en:copy('en'),el:copy('el')};
}
export function seed(id){
 const files=structuredClone(baseline);if(id==='neutral')return files;
 const settings=files['content/settings/site.json'];
 const names={'professional-services':'Example Advisory',trades:'Example Home Services',accommodation:'Example Guesthouse',studio:'Example Movement Studio'};
 settings.brand.name=names[id];settings.legal.businessName=names[id];
 settings.brand.tagline=intro.en;settings.translations.el.brand.tagline=intro.el;
 settings.contact={email:'hello@example.com',phone:'',address:''};settings.translations.el.contact.address='';
 const heroTitles={'professional-services':pair('Clear thinking for your next step','Καθαρή σκέψη για το επόμενο βήμα'),trades:pair('Practical help for your space','Πρακτική βοήθεια για τον χώρο σας'),accommodation:pair('A place to pause and explore','Ένας τόπος για ξεκούραση και εξερεύνηση'),studio:pair('Make space for movement','Δώστε χώρο στην κίνηση')};
 const hero=section('hero','intro',heroTitles[id]);
 const offerings=section('offering-list','services_preview',pair(id==='studio'?'Explore our sample classes':'Explore our services',id==='studio'?'Ενδεικτικά μαθήματα':'Γνωρίστε τις υπηρεσίες'));
 const people=section('people-list','our_people',pair('Meet the people','Γνωρίστε την ομάδα'));
 const steps=section('steps','our_process',pair('How it works','Πώς λειτουργεί'),{reference:{items:[{id:'listen'},{id:'plan'}]},copy:l=>({items:[{id:'listen',title:l==='el'?'Συζητάμε':'We listen',body:intro[l]},{id:'plan',title:l==='el'?'Σχεδιάζουμε':'We plan',body:intro[l]}]})});
 const faq=section('faq','questions',pair('Useful questions','Χρήσιμες ερωτήσεις'),{reference:{items:[{id:'start'}]},copy:l=>({items:[{id:'start',question:l==='el'?'Πώς ξεκινάμε;':'How do we start?',answer:l==='el'?'Στείλτε μας ένα μήνυμα από τη [φόρμα επικοινωνίας](/contact).':'Send a message through the [contact form](/contact).'}]})});
 const articles=section('article-list','insights_preview',pair('Ideas and perspective','Ιδέες και απόψεις'));
 const cta=section('cta','next_step',pair('Start a conversation','Ας μιλήσουμε'),{copy:l=>({link:{label:l==='el'?'Επικοινωνία':'Contact us',href:'/contact'}})});
 const info=section('rich-text','practical_information',pair(id==='trades'?'Service areas':'Studio information',id==='trades'?'Περιοχές εξυπηρέτησης':'Πληροφορίες studio'));
 const gallery=section('gallery','our_space',pair('An illustrative look around','Μια ενδεικτική ματιά'),{reference:{items:[{id:'landscape',media:{src:'/uploads/starter-samples/abstract-landscape.png',crop:'center'}},{id:'portrait',media:{src:'/uploads/starter-samples/abstract-portrait.png',crop:'center'}}]},copy:l=>({items:['landscape','portrait'].map(i=>({id:i,alt:l==='el'?'Πρωτότυπο αφηρημένο δείγμα, όχι φωτογραφία καταλύματος.':'Original abstract sample, not a property photograph.',caption:intro[l]}))})});
 const rooms=section('room-list','rooms_preview',pair('Sample rooms','Ενδεικτικά δωμάτια'),{copy:l=>({emptyMessage:l==='el'?'Δεν υπάρχουν δημοσιευμένα δωμάτια.':'No published rooms.'})});
 const amenities=section('rich-text','amenities',pair('Amenities and local information','Παροχές και τοπικές πληροφορίες'));
 const compositions={'professional-services':[hero,offerings,steps,people,articles,faq,cta],trades:[hero,offerings,info,steps,faq,cta],accommodation:[hero,gallery,rooms,amenities,cta],studio:[hero,offerings,people,steps,faq,info,cta]};
 const home=files['content/pages/home.json'];home.sections=compositions[id].map(s=>s.reference);
 home.copy.sections=compositions[id].map(s=>s.en);home.translations.el.copy.sections=compositions[id].map(s=>s.el);
 home.meta.title=heroTitles[id].en;home.translations.el.meta.title=heroTitles[id].el;
 if(id==='trades'||id==='studio'){
 const page=structuredClone(files['content/pages/about.json']);const label=id==='trades'?pair('Service areas','Περιοχές εξυπηρέτησης'):pair('Sample timetable','Ενδεικτικό πρόγραμμα');
 page.contentId=id==='trades'?'service_areas':'timetable';page._template='standard';page.slug=id==='trades'?'service-areas':'timetable';
 page.meta.title=label.en;page.translations.el.meta.title=label.el;
 page.copy.sections[0].title=label.en;page.translations.el.copy.sections[0].title=label.el;
 files['content/pages/'+page.slug+'.json']=page;
 settings.navigation.push({pageId:page.contentId,label:label.en});settings.translations.el.navigation.push({pageId:page.contentId,label:label.el});
 }
 if(id==='accommodation'){
 const index=files['content/pages/rooms.json'];index.status='published';index.translations.el.status='published';
 settings.navigation.splice(1,0,{pageId:'rooms',label:'Rooms'});settings.translations.el.navigation.splice(1,0,{pageId:'rooms',label:'Δωμάτια'});
 const roomCopy=l=>({status:'published',title:l==='el'?'Ενδεικτικό δωμάτιο':'Illustrative room',description:intro[l],body:intro[l],seoDescription:'',bedDescription:l==='el'?'Ενδεικτική διαρρύθμιση':'Illustrative layout',imageCopy:[],amenityCopy:[{id:'sample',label:l==='el'?'Ενδεικτική παροχή':'Illustrative amenity'}]});
 files['content/rooms/sample-room.json']={contentId:'sample-room',slug:'illustrative-room',...roomCopy('en'),maxGuests:2,images:[],amenities:[{id:'sample'}],translations:{el:roomCopy('el')}};
 }
 if(id==='studio'){
 const offering=files['content/offerings/sample-service.json'];offering.title='Sample movement class';offering.translations.el.title='Ενδεικτικό μάθημα κίνησης';
 offering.description=intro.en;offering.translations.el.description=intro.el;
 }
 return files;
}
