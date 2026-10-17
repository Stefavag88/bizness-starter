export interface NavigationDraft {
  navigation: { pageId: string; label: string }[];
  translations: Record<
    string,
    { navigation: { pageId: string; label: string }[] }
  >;
}
export function assertNavigationMembership(values: NavigationDraft): void;
export function addNavigationItem<T extends NavigationDraft>(
  values: T,
  item: { pageId: string; label: string },
): T;
export function moveNavigationItem<T extends NavigationDraft>(
  values: T,
  pageId: string,
  direction: 'up' | 'down',
): T;
export function removeNavigationItem<T extends NavigationDraft>(
  values: T,
  pageId: string,
): T;
/** null selects the default-language list; strings select existing native locale keys. */
export function setNavigationLabel<T extends NavigationDraft>(
  values: T,
  localeKey: string | null,
  pageId: string,
  label: string,
): T;
