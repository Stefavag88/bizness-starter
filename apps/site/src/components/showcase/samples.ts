import type { LocalizedContent, LocalizedSection } from '../../../../../packages/content/types';
/** Presentation-only fixtures. All destinations are available localized pages. */
export function createShowcaseSamples(input: LocalizedContent): {
    locale: string;
    sections: LocalizedSection[];
    content: LocalizedContent;
} {
    const content = structuredClone(input);
    const locale = input.locale;
    const el = locale === 'el';
    const path = input.pages.find(p => p._template === 'contact')!.path;
    const text = el ? 'Σαφές κείμενο με **έμφαση** και χρήσιμες πληροφορίες.' : 'Clear copy with **emphasis** and useful information.';
    const link = { label: el ? 'Επικοινωνία' : 'Contact', href: path };
    const sections: LocalizedSection[] = [
        { _template: 'hero', copy: { title: el ? 'Μια σαφής εισαγωγή' : 'A clear introduction', description: text, link } },
        { _template: 'rich-text', copy: { title: el ? 'Κείμενο και ιεραρχία' : 'Text and hierarchy', body: el ? '### Λεπτομέρειες\n\n**Έντονα**, *πλάγια* και [επικοινωνία](' + path + ').\n\n- Πρώτο στοιχείο\n- Δεύτερο στοιχείο' : '### Details\n\n**Strong**, *emphasis* and [contact](' + path + ').\n\n- First item\n- Second item' } },
        { _template: 'offering-list', copy: { title: el ? 'Δείγμα OfferingList' : 'OfferingList example', description: text } },
        { _template: 'people-list', copy: { title: el ? 'Δείγμα PeopleList' : 'PeopleList example', description: text } },
        { _template: 'article-list', copy: { title: el ? 'Συνθετικό δείγμα ArticleList' : 'Synthetic ArticleList example', description: el ? 'Δείγμα παρουσίασης με σύνδεσμο επικοινωνίας· δεν αποτελεί δημοσιευμένο άρθρο.' : 'Presentation fixture linked to Contact; this is not a published article.' } },
        { _template: 'cta', copy: { title: el ? 'Το επόμενο βήμα' : 'The next step', description: text, link } },
    ].map((s, index) => ({ ...s, id: `showcase-${locale}-${index}-${s._template}`, variant: 'default', enabled: true, appearance: { surface: index % 2 ? 'muted' : 'default' } })) as LocalizedSection[];
    const sourceA = '/uploads/starter-samples/abstract-landscape.png';
    const sourceB = '/uploads/starter-samples/abstract-portrait.png';
    for (const [type, variants] of [['faq', ['default', 'expanded']], ['steps', ['default', 'cards']], ['media-text', ['default', 'reversed']], ['gallery', ['default', 'featured']]] as const) {
        for (const variant of variants) {
            const id = `showcase-${locale}-${type}-${variant}`;
            const intro = el ? 'Πρωτότυπα ουδέτερα δείγματα για σύγκριση διάταξης.' : 'Original neutral samples for comparing layouts.';
            const items = [1, 2].map((number, index) => ({ id: `item_${number}`, question: el ? `Πώς λειτουργεί το βήμα ${index + 1};` : `How does step ${index + 1} work?`, answer: text + ' [' + (el ? 'Επικοινωνία' : 'Contact') + '](' + path + ').', title: el ? `Βήμα ${index + 1}` : `Step ${index + 1}`, body: text }));
            const common = { id, _template: type, variant, enabled: true, appearance: { surface: 'default' as const } };
            if (type === 'faq')
                sections.push({ ...common, _template: type, variant: variant as 'default' | 'expanded', items: items.map(i => ({ id: i.id })), copy: { title: el ? `Συχνές ερωτήσεις — ${variant}` : `Frequently asked questions — ${variant}`, description: intro, items: items.map(({ id, question, answer }) => ({ id, question, answer })) } });
            if (type === 'steps')
                sections.push({ ...common, _template: type, variant: variant as 'default' | 'cards', items: items.map(i => ({ id: i.id })), copy: { title: el ? `Διαδικασία — ${variant}` : `Process — ${variant}`, description: intro, items: items.map(({ id, title, body }) => ({ id, title, body })) } });
            if (type === 'media-text')
                sections.push({ ...common, _template: type, variant: variant as 'default' | 'reversed', media: { src: sourceA, crop: variant === 'default' ? 'center' : 'top' }, copy: { title: el ? `Εικόνα και κείμενο — ${variant}` : `Media and text — ${variant}`, body: text, image: { alt: el ? 'Δείγμα: αφηρημένο τοπίο με κύκλο και επίπεδα.' : 'Sample: abstract landscape with a circle and layers.', caption: intro }, link } });
            if (type === 'gallery')
                sections.push({ ...common, _template: type, variant: variant as 'default' | 'featured', items: items.map((item, index) => ({ id: item.id, media: { src: index ? sourceB : sourceA, crop: index ? 'bottom' : 'center' } })), copy: { title: el ? `Συλλογή — ${variant}` : `Gallery — ${variant}`, description: intro, items: items.map((item, index) => ({ id: item.id, alt: el ? `Δείγμα αφηρημένης γεωμετρίας ${index + 1}` : `Sample abstract geometry ${index + 1}`, caption: intro })) } });
        }
    }
    const base = { contentId: `showcase-${locale}-card`, slug: 'showcase', status: 'published' as const, title: el ? 'Δείγμα κάρτας' : 'Sample card', description: text, body: '', seoDescription: '', path, alternates: [] };
    content.offerings = [{ ...base }];
    content.people = [{ ...base, role: el ? 'Οδηγός' : 'Guide' }];
    content.articles = [{ ...base, publishAt: '2026-01-01T09:00:00Z' }];
    return { locale, sections, content };
}
