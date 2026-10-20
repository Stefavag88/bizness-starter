const idPattern = /^[a-z][a-z0-9_]{0,79}$/;
// Partial native forms may contain empty labels. Membership, never prose, is structural.
export function assertNavigationMembership(values) {
  const ids = values.navigation.map((item) => item.pageId);
  if (
    ids.some((id) => typeof id !== 'string' || !idPattern.test(id)) ||
    new Set(ids).size !== ids.length
  )
    throw Error('Invalid or duplicate navigation page ID');
  for (const translation of Object.values(values.translations || {})) {
    const labels = translation.navigation;
    if (
      !Array.isArray(labels) ||
      labels.length !== ids.length ||
      new Set(labels.map((item) => item.pageId)).size !== ids.length ||
      labels.some((item) => !ids.includes(item.pageId))
    )
      throw Error('Translated navigation must match shared page IDs exactly');
  }
}
function indexOf(values, pageId) {
  assertNavigationMembership(values);
  const index = values.navigation.findIndex((item) => item.pageId === pageId);
  if (index < 0) throw Error('Unknown navigation page ID: ' + pageId);
  return index;
}
function labelValue(label) {
  if (typeof label !== 'string' || label.length > 200)
    throw Error('Navigation labels must be text of at most 200 characters');
}
export function addNavigationItem(values, { pageId, label }) {
  assertNavigationMembership(values);
  labelValue(label);
  if (
    typeof pageId !== 'string' ||
    !idPattern.test(pageId) ||
    values.navigation.some((item) => item.pageId === pageId)
  )
    throw Error('Invalid or duplicate navigation page ID');
  return {
    ...values,
    navigation: [...values.navigation, { pageId, label }],
    translations: Object.fromEntries(
      Object.entries(values.translations || {}).map(([locale, t]) => [
        locale,
        { ...t, navigation: [...t.navigation, { pageId, label: '' }] },
      ]),
    ),
  };
}
export function moveNavigationItem(values, pageId, direction) {
  const index = indexOf(values, pageId);
  if (!['up', 'down'].includes(direction))
    throw Error('Move direction must be up or down');
  const target = index + (direction === 'up' ? -1 : 1);
  if (target < 0 || target >= values.navigation.length)
    throw Error('Cannot move beyond navigation boundary');
  const navigation = [...values.navigation];
  [navigation[index], navigation[target]] = [
    navigation[target],
    navigation[index],
  ];
  return { ...values, navigation };
}
export function removeNavigationItem(values, pageId) {
  indexOf(values, pageId);
  return {
    ...values,
    navigation: values.navigation.filter((item) => item.pageId !== pageId),
    translations: Object.fromEntries(
      Object.entries(values.translations || {}).map(([locale, t]) => [
        locale,
        {
          ...t,
          navigation: t.navigation.filter((item) => item.pageId !== pageId),
        },
      ]),
    ),
  };
}
export function setNavigationLabel(values, localeKey, pageId, label) {
  const index = indexOf(values, pageId);
  labelValue(label);
  if (localeKey == null) {
    const navigation = [...values.navigation];
    navigation[index] = { ...navigation[index], label };
    return { ...values, navigation };
  }
  if (!Object.hasOwn(values.translations || {}, localeKey))
    throw Error('Unknown navigation locale: ' + localeKey);
  const t = values.translations[localeKey];
  return {
    ...values,
    translations: {
      ...values.translations,
      [localeKey]: {
        ...t,
        navigation: t.navigation.map((item) =>
          item.pageId === pageId ? { ...item, label } : item,
        ),
      },
    },
  };
}

// A destination is shared structure; translated labels stay attached to the menu item.
export function setNavigationDestination(values, pageId, destination, availablePageIds) {
  indexOf(values, pageId);
  if (typeof destination !== 'string' || !idPattern.test(destination) || !availablePageIds.includes(destination))
    throw Error('Choose an existing saved Page.');
  if (destination === pageId) return values;
  if (values.navigation.some(item => item.pageId === destination))
    throw Error('This page is already in the menu.');
  const replace = items => items.map(item => item.pageId === pageId ? { ...item, pageId: destination } : item);
  return {
    ...values,
    navigation: replace(values.navigation),
    translations: Object.fromEntries(Object.entries(values.translations || {}).map(([locale, translation]) => [
      locale, { ...translation, navigation: replace(translation.navigation) },
    ])),
  };
}
