import type { CompositionDraft } from "./composition.mjs";
export interface SectionItemCopy {
  id: string;
  [field: string]: unknown;
}
export function addSectionItem(
  values: CompositionDraft,
  sectionId: string,
  item: { id: string; copy: SectionItemCopy; media?: unknown },
): CompositionDraft;
export function moveSectionItem(
  values: CompositionDraft,
  sectionId: string,
  itemId: string,
  direction: "up" | "down",
): CompositionDraft;
export function removeSectionItem(
  values: CompositionDraft,
  sectionId: string,
  itemId: string,
): CompositionDraft;
export function addSectionItemTranslation(
  values: CompositionDraft,
  localeKey: string,
  sectionId: string,
  itemId: string,
  copy: SectionItemCopy,
): CompositionDraft;
export function setSectionVariant(
  values: CompositionDraft,
  sectionId: string,
  variant: string,
): CompositionDraft;
