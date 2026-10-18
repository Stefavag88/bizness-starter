import { mediaReferenceSchema } from "./media.mjs";
import { sectionDefinitions } from "./section-registry.mjs";
import { assertPageCapabilities } from "./composition.mjs";
const idPattern = /^[a-z][a-z0-9_]{0,79}$/;
function target(values, sectionId) {
  assertPageCapabilities(values);
  const section = values.sections.find((s) => s.id === sectionId);
  if (!section) throw Error("Unknown section ID");
  const definition = sectionDefinitions.find(
    (d) => d.type === section._template || d.nativeName === section._template,
  );
  if (!definition?.itemCopySchema || !Array.isArray(section.items))
    throw Error("Section does not support items");
  const ids = section.items.map((i) => i.id);
  if (
    ids.some((id) => typeof id !== "string" || !idPattern.test(id)) ||
    new Set(ids).size !== ids.length
  )
    throw Error("Invalid or duplicate item ID");
  const copy = entry(values.copy, sectionId);
  if (
    copy._template !== definition.type &&
    copy._template !== definition.nativeName
  )
    throw Error("Copy template must match section");
  const copyIds = Array.isArray(copy.items) ? copy.items.map((i) => i.id) : [];
  if (
    !Array.isArray(copy.items) ||
    copyIds.length !== ids.length ||
    new Set(copyIds).size !== copyIds.length ||
    copyIds.some((id) => !ids.includes(id))
  )
    throw Error("Default copy must match shared item IDs");
  return { section, definition };
}
function entry(copy, id) {
  const matches = copy.sections.filter((e) => e.id === id);
  if (matches.length !== 1) throw Error("Missing or duplicate section copy");
  return matches[0];
}
function validCopy(definition, id, copy) {
  if (!copy || copy.id !== id)
    throw Error("Item copy ID must match shared item");
  const projected = { ...copy };
  for (const { path } of definition.richFields.filter(
    (f) => f.path[0] === "items",
  )) {
    const key = path.at(-1),
      value = copy[key];
    if (value === undefined) continue;
    if (
      typeof value !== "string" &&
      (!value || value.type !== "root" || !Array.isArray(value.children))
    )
      throw Error("Item requires explicit rich text");
    projected[key] = "Draft";
  }
  // Draft controls preserve opaque ASTs; safe serialization and meaningful prose are save concerns.
  for (const key of ["question", "title", "alt"])
    if (projected[key] === "") projected[key] = "Draft";
  if (!definition.itemCopySchema.safeParse(projected).success)
    throw Error("Invalid item copy");
}
function replaceCopy(copy, sectionId, operation) {
  const current = entry(copy, sectionId);
  return {
    ...copy,
    sections: copy.sections.map((e) =>
      e === current ? { ...e, items: operation(e.items) } : e,
    ),
  };
}
export function addSectionItem(values, sectionId, { id, copy, media }) {
  const { section, definition } = target(values, sectionId);
  if (
    media !== undefined &&
    !Object.hasOwn(definition.referenceFields.items.element.shape, "media")
  )
    throw Error("Media is unsupported for this item type");
  if (
    typeof id !== "string" ||
    !idPattern.test(id) ||
    section.items.some((i) => i.id === id)
  )
    throw Error("Invalid or duplicate item ID");
  if (Object.hasOwn(definition.referenceFields.items.element.shape, "media"))
    media = mediaReferenceSchema.parse(media);
  validCopy(definition, id, copy);
  return {
    ...values,
    sections: values.sections.map((s) =>
      s === section
        ? { ...s, items: [...s.items, { id, ...(media ? { media } : {}) }] }
        : s,
    ),
    copy: replaceCopy(values.copy, sectionId, (items) => [...items, copy]),
  };
}
export function moveSectionItem(values, sectionId, itemId, direction) {
  const { section } = target(values, sectionId);
  const index = section.items.findIndex((i) => i.id === itemId);
  if (index < 0 || !["up", "down"].includes(direction))
    throw Error("Unknown item or direction");
  const next = index + (direction === "up" ? -1 : 1);
  if (next < 0 || next >= section.items.length) throw Error("Item boundary");
  const items = [...section.items];
  [items[index], items[next]] = [items[next], items[index]];
  return {
    ...values,
    sections: values.sections.map((s) => (s === section ? { ...s, items } : s)),
  };
}
export function removeSectionItem(values, sectionId, itemId) {
  const { section } = target(values, sectionId);
  if (!section.items.some((i) => i.id === itemId))
    throw Error("Unknown item ID");
  const prune = (copy) =>
    copy.sections.some((e) => e.id === sectionId)
      ? replaceCopy(copy, sectionId, (items) =>
          items.filter((i) => i.id !== itemId),
        )
      : copy;
  let translations = values.translations;
  for (const [locale, t] of Object.entries(translations)) {
    const copy = prune(t.copy);
    if (copy !== t.copy) {
      if (translations === values.translations)
        translations = { ...translations };
      translations[locale] = { ...t, copy };
    }
  }
  return {
    ...values,
    sections: values.sections.map((s) =>
      s === section
        ? { ...s, items: s.items.filter((i) => i.id !== itemId) }
        : s,
    ),
    copy: prune(values.copy),
    translations,
  };
}
export function addSectionItemTranslation(
  values,
  localeKey,
  sectionId,
  itemId,
  copy,
) {
  const { section, definition } = target(values, sectionId);
  if (!section.items.some((i) => i.id === itemId))
    throw Error("Unknown item ID");
  validCopy(definition, itemId, copy);
  const translation = values.translations[localeKey];
  if (!translation) throw Error("Translation must exist");
  const updated = replaceCopy(translation.copy, sectionId, (items) => {
    if (items.some((i) => i.id === itemId))
      throw Error("Item translation already exists");
    return [...items, copy];
  });
  return {
    ...values,
    translations: {
      ...values.translations,
      [localeKey]: { ...translation, copy: updated },
    },
  };
}
export function setSectionVariant(values, sectionId, variant) {
  assertPageCapabilities(values);
  const section = values.sections.find((s) => s.id === sectionId);
  const definition = sectionDefinitions.find(
    (d) => d.type === section?._template || d.nativeName === section?._template,
  );
  if (!definition?.variants.includes(variant))
    throw Error("Unsupported variant");
  return {
    ...values,
    sections: values.sections.map((s) =>
      s === section ? { ...s, variant } : s,
    ),
  };
}

/** Shared reference change; rich editor values are deliberately opaque. */
export function setSectionMedia(values, { sectionId, itemId, media }) {
  assertPageCapabilities(values);
  const section = values.sections.find((s) => s.id === sectionId);
  if (!section) throw Error("Unknown section ID");
  if (section._template === "gallery") {
    target(values, sectionId);
    if (!section.items.some((i) => i.id === itemId))
      throw Error("Unknown gallery item ID");
    if (media === null)
      throw Error("Remove the gallery item instead of clearing its image");
    const parsed = mediaReferenceSchema.parse(media);
    return {
      ...values,
      sections: values.sections.map((s) =>
        s === section
          ? {
              ...s,
              items: s.items.map((i) =>
                i.id === itemId ? { ...i, media: parsed } : i,
              ),
            }
          : s,
      ),
    };
  }
  if (
    !["media-text", "media_text"].includes(section._template) ||
    itemId !== undefined
  )
    throw Error("Section does not support media");
  const next = { ...section };
  if (media === null) delete next.media;
  else next.media = mediaReferenceSchema.parse(media);
  let result = {
    ...values,
    sections: values.sections.map((s) => (s === section ? next : s)),
  };
  if (media !== null) return result;
  const prune = (copy) => ({
    ...copy,
    sections: copy.sections.map((e) => {
      if (e.id !== sectionId || !Object.hasOwn(e, "image")) return e;
      const { image, ...retained } = e;
      return retained;
    }),
  });
  result.copy = prune(values.copy);
  result.translations = Object.fromEntries(
    Object.entries(values.translations || {}).map(([locale, t]) => [
      locale,
      { ...t, copy: prune(t.copy) },
    ]),
  );
  return result;
}
