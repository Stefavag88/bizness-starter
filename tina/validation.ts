import {getNativeDomainAdapters} from './domain-validation';
import type {NativeDomainOptions} from './domain-validation';
import {getDisabledDomainPages} from '../packages/content/domain-registry.mjs';
import {assertOwnedPageIdentity} from '../packages/content/domain-publication.mjs';
import { serializeMDX } from '@tinacms/mdx';
import type { ProjectConfig } from '../packages/config/project.mjs';
import {
  settingsSchema,
  pageSchema,
  offeringSchema,
  personSchema,
  articleSchema,
  campaignSchema,
} from '../packages/content/schemas.mjs';
import { isSafeLink } from '../packages/content/rich-text.mjs';
import { normalizeNativeLocales } from '../packages/content/native-locales.mjs';
import { validateCatalog } from '../packages/content/catalog.mjs';
import { localizeContent } from '../packages/content/localize.mjs';
import { publicRoutes } from '../packages/content/routes.mjs';
import {
  normalizePageDocument,
  normalizeSettingsDocument,
} from '../packages/content/documents.mjs';
import { sectionDefinitions } from '../packages/content/section-registry.mjs';
import { assertExistingPageIdentity } from '../packages/content/composition.mjs';
const schemas = {
  settings: settingsSchema,
  page: pageSchema,
  offering: offeringSchema,
  person: personSchema,
  article: articleSchema,
  campaign: campaignSchema,
};
function markdown(value: unknown, inline: boolean): string {
  if (typeof value === 'string') return value;
  function visit(node: any, depth = 0): void {
    if (!node || typeof node !== 'object' || depth > 40)
      throw Error('Invalid rich text node');
    if (typeof node.text === 'string') {
      if (
        (node.type !== undefined && node.type !== 'text') ||
        Object.keys(node).some(
          (k) => !['type', 'text', 'bold', 'italic', 'id'].includes(k),
        )
      )
        throw Error('Unsupported rich text mark');
      // The installed link dialog gives text leaves opaque editor IDs.
      if (
        Object.hasOwn(node, 'id') &&
        typeof node.id !== 'string' &&
        !(typeof node.id === 'number' && Number.isFinite(node.id))
      )
        throw Error('Invalid rich text editor ID');
      return;
    }
    const allowed = inline
      ? ['root', 'p', 'a', 'break']
      : [
          'root',
          'p',
          'a',
          'break',
          'h2',
          'h3',
          'ul',
          'ol',
          'li',
          'lic',
          'blockquote',
        ];
    if (!allowed.includes(node.type) || !Array.isArray(node.children))
      throw Error('Unsupported rich text node');
    if (
      node.type === 'a' &&
      node.title != null &&
      typeof node.title !== 'string'
    )
      throw Error('Invalid link title');
    if (node.type === 'a' && !isSafeLink(node.url))
      throw Error('Unsafe rich text link');
    if (
      Object.keys(node).some(
        (k) =>
          ![
            'type',
            'children',
            'url',
            'id',
            // The installed dialog owns target: undefined; no target behavior is enabled.
            ...(node.type === 'a'
              ? ['title', ...(node.target === undefined ? ['target'] : [])]
              : []),
          ].includes(k),
      )
    )
      throw Error('Unsupported rich text attribute');
    node.children.forEach((child: any) => visit(child, depth + 1));
  }
  visit(value);
  if ((value as any).type !== 'root') throw Error('Rich text must have a root');
  const result = serializeMDX(
    value as Parameters<typeof serializeMDX>[0],
    { name: 'body', type: 'rich-text', templates: [] },
    (url) => url,
  );
  if (typeof result !== 'string')
    throw Error('Rich text could not be serialized');
  return result;
}
export function nativeProjection(
  values: Record<string, unknown>,
  project: ProjectConfig,
  kind?:string,
  options:NativeDomainOptions={},
): Record<string, any> {
  const copy: any = normalizeNativeLocales(values, project);
  if (copy._collection !== 'page' && copy._template === copy._collection)
    delete copy._template;
  delete copy._collection;
  function prose(record: any): void {
    if (!record || typeof record !== 'object') return;
    for (const key of ['body', 'description'])
      if (Object.hasOwn(record, key))
        record[key] = markdown(record[key], key === 'description');
    if (record.legal && Object.hasOwn(record.legal, 'notice'))
      record.legal.notice = markdown(record.legal.notice, false);
    if (record.copy?.sections)
      for (const section of Object.values(record.copy.sections) as any[]) {
        const definition=sectionDefinitions.find(d=>d.type===section._template);
        if(!definition) continue;
        for(const {path,inline} of definition.richFields){
          const visit=(value:any,keys:readonly string[]):void=>{
            if(keys[0]==='*'){if(Array.isArray(value))value.forEach(item=>visit(item,keys.slice(1)));return;}
            if(!value || typeof value!=='object')return;
            if(keys.length===1){if(Object.hasOwn(value,keys[0]))value[keys[0]]=markdown(value[keys[0]],inline);}
            else visit(value[keys[0]],keys.slice(1));
          };
          visit(section,path);
        }
      }
  }
  const sectionLists = [
    copy.sections,
    copy.copy?.sections,
    ...Object.values(copy.translations || {}).map(
      (translation: any) => translation.copy?.sections,
    ),
  ];
  for (const list of sectionLists) {
    if (!Array.isArray(list)) continue;
    for (const section of list) {
      const definition = sectionDefinitions.find(
        (definition) => definition.nativeName === section._template,
      );
      if (definition) section._template = definition.type;
    }
  }
  const adapter=getNativeDomainAdapters(project,options).find(entry=>entry.collectionName===(kind??values._collection));
  if(adapter){
    const visit=(value:any,keys:readonly string[],inline:boolean):void=>{
      if(keys[0]==='*'){if(Array.isArray(value))value.forEach(item=>visit(item,keys.slice(1),inline));return;}
      if(!value||typeof value!=='object')return;
      if(keys.length===1){if(Object.hasOwn(value,keys[0]))value[keys[0]]=markdown(value[keys[0]],inline);}
      else visit(value[keys[0]],keys.slice(1),inline);
    };
    for(const record of [copy,...Object.values(copy.translations??{})])for(const field of adapter.richFields)visit(record,field.path,field.inline);
  }else{
    prose(copy);
    for (const translation of Object.values(copy.translations || {}))prose(translation);
  }
  return copy;
}

// Only this internal helper performs format validation without existing-record protection.
function parseNative(
  values: Record<string, unknown>,
  kind: string,
  project: ProjectConfig,
  options:NativeDomainOptions={},
): any {
  if (kind === 'campaign' && project.profile === 'enquiries')
    throw Error('Campaign copy is disabled');
  const schema = schemas[kind as keyof typeof schemas]??getNativeDomainAdapters(project,options).find(adapter=>adapter.collectionName===kind)?.schema;
  if (!schema) throw Error('Unknown collection');
  if (
    kind === 'page' &&
    Array.isArray(values.sections) &&
    values.sections.some(
      (section: any) =>
        !sectionDefinitions.some((d) => d.type === section._template),
    )
  )
    throw Error(
      'Shared section scalar types must use canonical registered names',
    );
  const projected = nativeProjection(values, project,kind,options);
  if (kind === 'page') return normalizePageDocument(projected);
  if (kind === 'settings') {
    const parsed = normalizeSettingsDocument(projected);
    for (const language of project.languages) {
      if (
        language.code !== project.locale &&
        !parsed.translations[language.code]
      )
        throw Error(
          'Missing required settings translation for locale ' + language.code,
        );
    }
    return parsed;
  }
  return schema.parse(projected);
}

export interface NativeSubmission {
  operation: 'create' | 'update';
  relativePath: string;
  filename?: string;
}
function submissionContext(context: NativeSubmission): NativeSubmission {
  if (!context || !['create', 'update'].includes(context.operation))
    throw Error('Explicit native create/update submission context is required');
  const relativePath =
    context.operation === 'create' && context.relativePath?.startsWith('/')
      ? context.relativePath.slice(1)
      : context.relativePath;
  if (
    typeof relativePath !== 'string' ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]*\.json$/.test(relativePath)
  )
    throw Error(
      'Use flat collection files; save documents directly in their collection folder.',
    );
  if (
    context.filename !== undefined &&
    (context.operation !== 'create' ||
      context.filename + '.json' !== relativePath)
  )
    throw Error('Native filename metadata must match the flat creation path');
  return { ...context, relativePath };
}
export function resolveNativeSubmission(
  form: any,
  values: Record<string, unknown>,
  collectionPath: string,
): NativeSubmission {
  const operation = form.crudType;
  const path = form.path;
  if (typeof path !== 'string' || !path.startsWith(collectionPath + '/'))
    throw Error('Native form path must identify a flat collection file');
  if (path.slice(collectionPath.length + 1).startsWith('/'))
    throw Error('Native form path must identify a flat collection file');
  const context = submissionContext({
    operation,
    relativePath: path.slice(collectionPath.length + 1),
    ...(Object.hasOwn(values, 'filename')
      ? { filename: values.filename as string }
      : {}),
  });
  if (
    operation === 'create' &&
    (typeof values.filename !== 'string' ||
      values.filename + '.json' !== context.relativePath)
  )
    throw Error('Native filename metadata must match the creation path');
  if (operation === 'update' && Object.hasOwn(values, 'filename'))
    throw Error('Creation metadata is not accepted on update');
  return context;
}
function submissionValues(
  values: Record<string, unknown>,
  context?: NativeSubmission,
) {
  if (!Object.hasOwn(values, 'filename')) return values;
  if (
    !context ||
    context.operation !== 'create' ||
    context.filename !== values.filename ||
    context.relativePath !== values.filename + '.json'
  )
    throw Error('Unrecognized creation filename metadata');
  const { filename, ...detached } = values;
  return detached;
}
export function validateNativeSave(
  values: Record<string, unknown>,
  kind: string,
  project: ProjectConfig,
  currentPage?: unknown,
  submission?: NativeSubmission,
  options:NativeDomainOptions={},
): void {
  const context = submission ? submissionContext(submission) : undefined;
  if (
    kind === 'page' &&
    context?.operation === 'create' &&
    values._template !== 'standard'
  )
    throw Error(
      'Create a Standard page. Special page templates are reserved for existing records.',
    );
  const parsed = parseNative(submissionValues(values, context), kind, project,options);
  if(kind!=='page'){
    const adapter=getNativeDomainAdapters(project,options).find(entry=>entry.collectionName===kind);
    if(adapter){
      if(!context)throw Error('Explicit domain create/update submission is required');
      if(context.operation==='create'&&!adapter.allowCreate)throw Error('Domain creation is disabled');
      adapter.assertIdentity(parsed,currentPage?parseNative(currentPage as Record<string,unknown>,kind,project,options):undefined,context);
    }
    return;
  }
  assertOwnedPageIdentity(parsed,context?.relativePath,options.registry);
  if (context?.operation === 'create') {
    if (
      parsed.status !== 'draft' ||
      Object.values(parsed.translations).some(
        (translation: any) => translation.status !== 'draft',
      )
    )
      throw Error(
        'Create Standard pages and explicitly supplied translations as drafts. Save first, then change publication.',
      );
    return;
  }
  if (!currentPage)
    throw Error(
      'Current native page record is required to protect existing page identity',
    );
  const original = parseNative(
    currentPage as Record<string, unknown>,
    'page',
    project,options,
  );
  assertExistingPageIdentity(parsed, original);
}
export function beforeSubmit(
  values: Record<string, unknown>,
  kind: string,
  project: ProjectConfig,
  currentPage?: unknown,
  submission?: NativeSubmission,
  options:NativeDomainOptions={},
) {
  validateNativeSave(values, kind, project, currentPage, submission,options);
  return values;
}

// Read the complete current data layer before validating the candidate catalog.
export async function validateCurrentSave(
  values: Record<string, unknown>,
  kind: string,
  project: ProjectConfig,
  cms: any,
  submission: NativeSubmission,
  options:NativeDomainOptions={},
) {
  const context = submissionContext(submission),
    relativePath = context.relativePath;
  const candidate = submissionValues(values, context);
  const adapters=getNativeDomainAdapters(project,options);
  if(!Object.hasOwn(schemas,kind)&&!adapters.some(adapter=>adapter.collectionName===kind))throw Error('Unknown or disabled collection: '+kind);
  if (context.operation === 'create')validateNativeSave(values, kind, project, undefined, context,options);
  else parseNative(candidate, kind, project,options);
  const source: any = {
    domains:Object.fromEntries(adapters.map(adapter=>[adapter.key,[]])),
    pages: [],
    offerings: [],
    people: [],
    articles: [],
    campaigns: [],
    now: new Date().toISOString(),
  };
  const target = (collection: string) =>
    collection === 'page'
      ? 'pages'
      : collection === 'person'
        ? 'people'
        : collection + 's';
  const collections = [
    'settings',
    'page',
    'offering',
    'person',
    ...(project.articles ? ['article'] : []),
    ...(project.profile === 'enquiries' ? [] : ['campaign']),
    ...adapters.map(adapter=>adapter.collectionName),
  ];
  const disabledPages=new Set([...getDisabledDomainPages(project,options.registry).map(page=>page.filename),...(!project.articles?['insights.json']:[])]);
  const append=(collection:string,record:any)=>{const adapter=adapters.find(entry=>entry.collectionName===collection);if(adapter)source.domains[adapter.key].push(record);else source[target(collection)].push(record);};
  for (const collection of collections) {
    let after: string | null = null;
    let more = true;
    let replaced = false;
    while (more) {
      const response: any = await cms.api.tina.request(
        `query Catalog($after:String){${collection}Connection(first:100,after:$after){edges{node{... on Document{_values _sys{relativePath}}}}pageInfo{hasNextPage endCursor}}}`,
        { variables: { after } },
      );
      const result = response[collection + 'Connection'];
      for (const edge of result.edges) {
        if(collection==='page'&&disabledPages.has(edge.node._sys.relativePath))continue;
        if (
          collection === kind &&
          context.operation === 'create' &&
          edge.node._sys.relativePath.toLowerCase() ===
            relativePath.toLowerCase()
        )
          throw Error(
            'A document already exists at this filename. Choose a unique flat filename.',
          );
        const matches =
          collection === kind && edge.node._sys.relativePath === relativePath;
        if (matches) {
          if (context.operation === 'create')
            throw Error(
              'A document already exists at this filename. Choose a unique flat filename.',
            );
          replaced = true;
          // Match persisted filename, never candidate identity or an old descriptor.
          validateNativeSave(values, kind, project, edge.node._values, context,options);
        }
        const record = parseNative(
          matches ? candidate : edge.node._values,
          collection,
          project,options,
        );
        if(collection==='page')assertOwnedPageIdentity(record,edge.node._sys.relativePath,options.registry);
        if (collection === 'settings') source.settings = record;
        else append(collection,record);
      }
      more = result.pageInfo.hasNextPage;
      after = result.pageInfo.endCursor;
    }
    if (
      collection === kind &&
      !replaced &&
      (kind === 'page'||adapters.some(adapter=>adapter.collectionName===kind)) &&
      context.operation === 'update'
    )
      throw Error(
        'Existing page identity is protected; current native record was not found',
      );
    if (collection === kind && !replaced && kind !== 'settings')
      append(collection,parseNative(candidate, collection, project,options));
  }
  if (kind === 'page' && context.operation === 'create') {
    const pages = source.pages.filter((p: any) => p.slug === candidate.slug);
    if (pages.length > 1)
      throw Error(
        'Page slug must be unique across the current catalog, including drafts',
      );
  }
  validateCatalog(source, project,options.registry);
  if ((kind === 'page'||adapters.some(adapter=>adapter.collectionName===kind)) && context.operation === 'create') {
    // Reserve actual URLs across the complete catalog, including unpublished records.
    // This detached availability projection never changes publication in the native form.
    const planned = { ...source };
    for (const key of ['pages', 'offerings', 'people', 'articles'])
      planned[key] = source[key].map((record: any) => ({
        ...record,
        status: 'published',
        publishAt: undefined,
      }));
    planned.domains=Object.fromEntries(Object.entries(source.domains).map(([key,records]:any)=>[key,records.map((record:any)=>({...record,status:'published',publishAt:undefined}))]));
    publicRoutes(localizeContent(planned, project.locale, project,options.registry));
  }
  return values;
}
