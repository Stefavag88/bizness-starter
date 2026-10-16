import { sectionDefinitions } from './section-registry.mjs';

const idPattern = /^[a-z][a-z0-9_]{0,79}$/;
function definition(type) {
  const registered = sectionDefinitions.find(entry => entry.type === type || entry.nativeName === type);
  if (!registered) throw Error('Unknown section type: ' + type);
  return registered;
}
function sectionIndex(values, id) {
  const index = values.sections.findIndex(section => section.id === id);
  if (index < 0) throw Error('Unknown section ID: ' + id);
  return index;
}
function isRequired(values, section) {
  return definition(section._template).type === 'hero' || (values.contentId === 'privacy' && section.id === 'privacy_details');
}

// This guard inspects shared capabilities only. Complete copy validation belongs to save.
export function assertPageCapabilities(candidate) {
  const ids = new Set();
  const heroes = [];
  for (const section of candidate.sections) {
    if (typeof section.id !== 'string' || !idPattern.test(section.id) || ids.has(section.id)) throw Error('Invalid or duplicate section ID');
    ids.add(section.id);
    const registered = definition(section._template);
    if (!registered.variants.includes(section.variant)) throw Error('Unknown section variant');
    if (typeof section.enabled !== 'boolean') throw Error('Section enabled state must be boolean');
    if (registered.type === 'hero') heroes.push(section);
  }
  if (heroes.length !== 1 || !heroes[0].enabled || candidate.sections[0] !== heroes[0]) {
    throw Error('Each page requires exactly one enabled hero as its first section');
  }
  if (candidate.contentId === 'privacy') {
    const required = candidate.sections.find(section => section.id === 'privacy_details');
    if (!required || definition(required._template).type !== 'rich-text' || !required.enabled) {
      throw Error('The privacy_details rich-text section is required and must remain enabled');
    }
  }
}

export function assertExistingPageIdentity(candidate, previous) {
  if (!previous) throw Error('Current native page record is required to protect page identity');
  assertPageCapabilities(candidate);
  assertPageCapabilities(previous);
  if (candidate.contentId !== previous.contentId || candidate.slug !== previous.slug || candidate._template !== previous._template) {
    throw Error('Existing page identity is protected');
  }
  const oldTypes = new Map(previous.sections.map(section => [section.id, definition(section._template).type]));
  for (const section of candidate.sections) {
    if (oldTypes.has(section.id) && oldTypes.get(section.id) !== definition(section._template).type) {
      throw Error('Existing section type is protected; remove it and add a new section ID');
    }
  }
  if (candidate.sections[0].id !== previous.sections[0].id) throw Error('Existing hero identity is protected');
}

function assertCopy(copy, id, registered, translation = false) {
  if (!copy || copy.id !== id || definition(copy._template).type !== registered.type) throw Error('Copy ID and type must match the shared section');
  const { id: ignoredId, _template: ignoredType, ...fields } = copy;
  // Validate scalar fields and membership, without parsing or rewriting any native AST.
  const projection = { ...fields };
  for (const key of ['body', 'description']) {
    if (!(key in registered.copySchema.shape)) continue;
    const value = fields[key];
    if (typeof value !== 'string' && (!value || value.type !== 'root' || !Array.isArray(value.children))) {
      throw Error('Copy requires explicit rich text: ' + key);
    }
    projection[key] = '';
  }
  // Explicit translation drafts may start empty; publication and required prose are save concerns.
  if (translation) {
    if (projection.title === '') projection.title = 'Draft';
    if (projection.link && typeof projection.link === 'object') {
      projection.link = { ...projection.link };
      if (projection.link.label === '') projection.link.label = 'Draft';
      if (projection.link.href === '') projection.link.href = '/';
    }
  }
  if (!registered.copySchema.safeParse(projection).success) throw Error('Invalid section copy fields');
}

export function addSection(values, { type, id, afterId, copy }) {
  assertPageCapabilities(values);
  const registered = definition(type);
  if (registered.type === 'hero') throw Error('The required hero cannot be added');
  if (typeof id !== 'string' || !idPattern.test(id) || values.sections.some(section => section.id === id)) throw Error('Invalid or duplicate section ID');
  const index = sectionIndex(values, afterId);
  assertCopy(copy, id, registered);
  const section = { id, _template: registered.type, variant: 'default', enabled: false, appearance: { surface: 'default' } };
  const sections = [...values.sections];
  sections.splice(index + 1, 0, section);
  return { ...values, sections, copy: { ...values.copy, sections: [...values.copy.sections, copy] } };
}

export function moveSection(values, id, direction) {
  assertPageCapabilities(values);
  const index = sectionIndex(values, id);
  if (direction !== 'up' && direction !== 'down') throw Error('Move direction must be up or down');
  const target = index + (direction === 'up' ? -1 : 1);
  if (definition(values.sections[index]._template).type === 'hero' || target < 1 || target >= values.sections.length) throw Error('Cannot move section past the hero or page boundary');
  const sections = [...values.sections];
  [sections[index], sections[target]] = [sections[target], sections[index]];
  return { ...values, sections };
}

export function setSectionEnabled(values, id, enabled) {
  assertPageCapabilities(values);
  const index = sectionIndex(values, id);
  if (typeof enabled !== 'boolean') throw Error('Section enabled state must be boolean');
  if (!enabled && isRequired(values, values.sections[index])) throw Error('Required section must remain enabled');
  const sections = [...values.sections];
  sections[index] = { ...sections[index], enabled };
  return { ...values, sections };
}

export function removeSection(values, id) {
  assertPageCapabilities(values);
  const index = sectionIndex(values, id);
  if (isRequired(values, values.sections[index])) throw Error('Required section cannot be removed');
  const prune = copy => copy.sections.some(entry => entry.id === id)
    ? { ...copy, sections: copy.sections.filter(entry => entry.id !== id) } : copy;
  let translations = values.translations;
  for (const [locale, translation] of Object.entries(values.translations)) {
    const copy = prune(translation.copy);
    if (copy !== translation.copy) {
      if (translations === values.translations) translations = { ...translations };
      translations[locale] = { ...translation, copy };
    }
  }
  return { ...values, sections: values.sections.filter(section => section.id !== id), copy: prune(values.copy), translations };
}

export function addTranslationCopy(values, localeKey, sectionId, copy) {
  assertPageCapabilities(values);
  const section = values.sections[sectionIndex(values, sectionId)];
  if (!Object.hasOwn(values.translations, localeKey)) throw Error('Existing translation metadata is required');
  const translation = values.translations[localeKey];
  if (translation.copy.sections.some(entry => entry.id === sectionId)) throw Error('Translation copy already exists');
  assertCopy(copy, sectionId, definition(section._template), true);
  return { ...values, translations: { ...values.translations, [localeKey]: {
    ...translation, copy: { ...translation.copy, sections: [...translation.copy.sections, copy] },
  } } };
}
