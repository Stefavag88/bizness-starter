export const sectionRegistry=Object.freeze({'hero':'default','rich-text':'default','offering-list':'default','people-list':'default','article-list':'default','cta':'default'});
export function rendererKey(type:string,variant:string):keyof typeof sectionRegistry {
 if(!Object.hasOwn(sectionRegistry,type)||variant!=='default')throw Error('Unsupported section '+type+'/'+variant);
 return type as keyof typeof sectionRegistry;
}
