import {
  createElement as h,
  lazy,
  Suspense,
  useEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import type { NavigationDraft } from '../../packages/content/navigation.mjs';
import {
  addNavigationItem,
  moveNavigationItem,
  removeNavigationItem,
  setNavigationLabel,
} from '../../packages/content/navigation.mjs';
export function applyNavigation(
  form: any,
  operation: (v: NavigationDraft) => NavigationDraft,
) {
  const before = form.getState().values,
    after = operation(before);
  form.batch(() => {
    for (const key of ['navigation', 'translations'] as const)
      if (after[key] !== before[key]) form.change(key, after[key]);
  });
}
export function navigationLabelEntries(
  values: NavigationDraft,
  locale: string | null,
) {
  return values.navigation.map((item) => ({
    pageId: item.pageId,
    label: locale
      ? (values.translations[locale]?.navigation.find(
          (entry) => entry.pageId === item.pageId,
        )?.label ?? '')
      : item.label,
  }));
}
// Tina's runtime is loaded only in the browser; schema construction stays Node-safe.
const NativeNavigation = lazy(async () => {
  const { useCMS } = await import('tinacms');
  return {
    default: (props: any) => h(NavigationEditor, { ...props, cms: useCMS() }),
  };
});
export function NavigationControls(props: any) {
  return h(Suspense, { fallback: null }, h(NativeNavigation, props));
}
export function visibleNativePages(edges:readonly any[],excludedFiles:readonly string[]){return edges.filter(edge=>!excludedFiles.includes(edge.node._sys?.relativePath)).map(edge=>edge.node._values);}
export function NavigationEditor({ field, tinaForm, cms, disabledPageFiles=[] }: any) {
  const form = tinaForm.finalForm;
  const values = useSyncExternalStore(
    (callback) => form.subscribe(callback, { values: true }),
    () => form.getState().values,
    () => form.getState().values,
  ) as NavigationDraft;
  const locale =
    /^translations\.([^.]+)\.navigation$/.exec(field.name)?.[1] ?? null;
  const [pages, setPages] = useState<{ contentId: string; slug: string }[]>([]),
    [error, setError] = useState(''),
    [destination, setDestination] = useState(''),
    [label, setLabel] = useState(''),
    [refresh, setRefresh] = useState(0),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (locale) return;
    let active = true;
    setLoaded(false);
    (async () => {
      const records = [];
      let after: string | null = null,
        more = true;
      while (more) {
        const result: any = await cms.api.tina.request(
          'query NavigationPages($after:String){pageConnection(first:100,after:$after){edges{node{... on Document{_values _sys{relativePath}}}}pageInfo{hasNextPage endCursor}}}',
          { variables: { after } },
        );
        records.push(
          ...visibleNativePages(result.pageConnection.edges,disabledPageFiles),
        );
        more = result.pageConnection.pageInfo.hasNextPage;
        after = result.pageConnection.pageInfo.endCursor;
      }
      if (active) {
        setPages(records);
        setLoaded(true);
        setError('');
      }
    })().catch((e) => {
      if (active) setError(e.message);
    });
    return () => {
      active = false;
    };
  }, [cms, locale, refresh]);
  const run = (operation: (v: NavigationDraft) => NavigationDraft) => {
    try {
      applyNavigation(form, operation);
      setError('');
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  };
  return h(
    'div',
    {},
    h(
      'p',
      {},
      locale
        ? 'Enter a label for every shared destination. Shared navigation controls the order.'
        : 'Choose saved Pages explicitly. Enter a label in each configured language before saving.',
    ),
    error && h('p', { role: 'alert' }, error),
    ...navigationLabelEntries(values, locale).map((item, index) =>
      h(
        'fieldset',
        { key: item.pageId, 'data-navigation-id': item.pageId },
        h('legend', {}, item.pageId),
        h(
          'label',
          {},
          'Label for ' + item.pageId,
          h('input', {
            'aria-label': 'Label for ' + item.pageId,
            type: 'text',
            value: item.label,
            onChange: (e: any) =>
              run((v) =>
                setNavigationLabel(v, locale, item.pageId, e.target.value),
              ),
          }),
        ),
        ...(!locale
          ? [
              ...Object.keys(values.translations || {}).map((key) =>
                h(
                  'label',
                  { key },
                  key + ' label for ' + item.pageId,
                  h('input', {
                    'aria-label': key + ' label for ' + item.pageId,
                    type: 'text',
                    value: navigationLabelEntries(values, key)[index].label,
                    onChange: (e: any) =>
                      run((v) =>
                        setNavigationLabel(v, key, item.pageId, e.target.value),
                      ),
                  }),
                ),
              ),
              h(
                'button',
                {
                  type: 'button',
                  disabled: index === 0,
                  'aria-label': 'Move navigation ' + item.pageId + ' up',
                  onClick: () =>
                    run((v) => moveNavigationItem(v, item.pageId, 'up')),
                },
                'Move up',
              ),
              h(
                'button',
                {
                  type: 'button',
                  disabled: index === values.navigation.length - 1,
                  'aria-label': 'Move navigation ' + item.pageId + ' down',
                  onClick: () =>
                    run((v) => moveNavigationItem(v, item.pageId, 'down')),
                },
                'Move down',
              ),
              h(
                'button',
                {
                  type: 'button',
                  'aria-label': 'Remove navigation ' + item.pageId,
                  onClick: () =>
                    run((v) => removeNavigationItem(v, item.pageId)),
                },
                'Remove link',
              ),
            ]
          : []),
      ),
    ),
    ...(!locale
      ? [
          h(
            'label',
            {},
            'Saved Page destination',
            h(
              'select',
              {
                'aria-label': 'Saved Page destination',
                value: destination,
                onChange: (e: any) => setDestination(e.target.value),
              },
              h(
                'option',
                { value: '' },
                loaded ? 'Choose a saved Page' : 'Loading saved Pages',
              ),
              ...pages
                .filter(
                  (p) =>
                    !values.navigation.some(
                      (item) => item.pageId === p.contentId,
                    ),
                )
                .map((p) =>
                  h(
                    'option',
                    { key: p.contentId, value: p.contentId },
                    p.contentId + ' /' + p.slug,
                  ),
                ),
            ),
          ),
          h(
            'button',
            { type: 'button', onClick: () => setRefresh((n) => n + 1) },
            'Refresh saved Pages',
          ),
          h(
            'label',
            {},
            'New navigation label',
            h('input', {
              'aria-label': 'New navigation label',
              value: label,
              onChange: (e: any) => setLabel(e.target.value),
            }),
          ),
          h(
            'button',
            {
              type: 'button',
              disabled: !loaded || !destination || !label.trim(),
              onClick: () => {
                if (!pages.some((p) => p.contentId === destination)) {
                  setError('Choose an existing saved Page.');
                  return;
                }
                if (
                  run((v) =>
                    addNavigationItem(v, { pageId: destination, label }),
                  )
                ) {
                  setDestination('');
                  setLabel('');
                }
              },
            },
            'Add navigation item',
          ),
        ]
      : []),
  );
}
