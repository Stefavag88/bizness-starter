// Native GraphQL field names encode regional locale separators. Canonical snapshots do not.
export function normalizeNativeLocales(value, project) {
 const copy=structuredClone(value);
 if (!copy.translations) return copy;
 const normalized={};
 for(const [key,translation] of Object.entries(copy.translations)) {
  const locale=project.languages.find(l=>l.code===key||l.code.replaceAll('-','_')===key)?.code;
  if(!locale||locale===project.locale)throw Error('Unexpected translation locale '+key);
  if(Object.hasOwn(normalized,locale))throw Error('Duplicate canonical/native locale alias '+locale);
  normalized[locale]=translation;
 }
 copy.translations=normalized;return copy;
}
