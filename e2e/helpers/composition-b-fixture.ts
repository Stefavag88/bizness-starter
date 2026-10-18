import { readFileSync, writeFileSync } from 'node:fs';
import { parseProject } from '../../packages/config/project.mjs';
import { readContent } from '../../packages/content/read.mjs';
import { localizeContent } from '../../packages/content/localize.mjs';
import { normalizePageDocument } from '../../packages/content/documents.mjs';
import { createShowcaseSamples } from '../../apps/site/src/components/showcase/samples';
import { createCmsSources } from './cms-source-ownership';
/** Node-owned seed only. This does not prove native authoring or upload. */
export function createCompositionBDocument(name: string, status = 'published') {
    const project = parseProject(JSON.parse(readFileSync('project.json', 'utf8')));
    const snapshot = readContent(process.cwd(), project);
    const samples = ['en', 'el'].map(locale => createShowcaseSamples(localizeContent(snapshot, locale, project)));
    const id = (section: any) => section._template.replaceAll('-', '_') + '_' + section.variant;
    const sections = samples[0].sections.map(({ copy, ...section }) => ({ ...section, id: id(section) }));
    const copy = (sample: typeof samples[number]) => ({ sections: sample.sections.map(section => ({ id: id(section), _template: section._template, ...section.copy })) });
    const document: any = { contentId: name, _template: 'standard', slug: name.replaceAll('_', '-'), status, meta: { title: 'Composition B sample', seoDescription: '' }, sections, copy: copy(samples[0]), translations: { el: { status, meta: { title: 'Δείγμα σύνθεσης Β', seoDescription: '' }, copy: copy(samples[1]) } } };
    const optional = { id: 'only_default', _template: 'faq', variant: 'expanded', enabled: true, appearance: { surface: 'muted' }, items: [{ id: 'one' }] };
    document.sections.push(optional, { id: 'text_only', _template: 'media-text', variant: 'reversed', enabled: true, appearance: { surface: 'default' } });
    document.copy.sections.push({ id: 'only_default', _template: 'faq', title: 'English section only', description: '', items: [{ id: 'one', question: 'English only?', answer: 'This entire optional section is omitted in Greek.' }] });
    for (const [locale, value] of [['en', document.copy], ['el', document.translations.el.copy]] as const)
        value.sections.push({ id: 'text_only', _template: 'media-text', title: locale === 'en' ? 'Text without an image' : 'Κείμενο χωρίς εικόνα', body: locale === 'en' ? '**Text only** with a safe [contact link](/contact).' : '**Μόνο κείμενο** με ασφαλή [επικοινωνία](/contact).', link: { label: locale === 'en' ? 'Contact' : 'Επικοινωνία', href: '/contact' } });
    normalizePageDocument(document);
    return document;
}
export function ownCompositionBPage(name: string, backup: string) {
    const path = 'content/pages/' + name + '.json';
    const sources = createCmsSources([path], backup, { allowCreate: true });
    if (sources.originalState(path).exists)
        throw Error('Public fixture must be initially absent');
    return {
        path, sources,
        create(document: any) { normalizePageDocument(document); sources.assertUnchanged(); sources.createAbsent(path, document, d => d.contentId === name); },
        replace(document: any, { validate = true } = {}) { if (!sources.owns(path)) throw Error('Public update requires an exclusively created owned fixture'); if (validate)
            normalizePageDocument(document); sources.assertUnchanged(); writeFileSync(path, JSON.stringify(document, null, 2) + '\n'); sources.capture(path, document, d => d.contentId === name); },
        restore: () => sources.restore(),
    };
}
