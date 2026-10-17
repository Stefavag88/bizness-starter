import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { addSection } from "../packages/content/composition.mjs";
import {
  addSectionItem,
  moveSectionItem,
  removeSectionItem,
  addSectionItemTranslation,
  setSectionVariant,
} from "../packages/content/section-items.mjs";
const ast = {
  type: "root",
  children: [{ type: "p", children: [{ text: "Answer", bold: true }] }],
};
const item = (id = "same") => ({ id, question: "Question", answer: ast });
function draft(): any {
  let v = JSON.parse(readFileSync("content/pages/about.json", "utf8"));
  for (const id of ["faq_a", "faq_b"])
    v = addSection(v, {
      type: "faq",
      id,
      afterId: "intro",
      copy: { id, _template: "faq", title: "FAQ", description: "", items: [] },
    });
  return v;
}
it("scopes equal item IDs to their section and preserves unrelated ASTs", () => {
  const v = draft();
  const a: any = addSectionItem(v, "faq_a", { id: "same", copy: item() });
  const b: any = addSectionItem(a, "faq_b", { id: "same", copy: item() });
  expect(b.sections.find((s: any) => s.id === "faq_a").items).toEqual([
    { id: "same" },
  ]);
  expect(b.copy.sections.find((s: any) => s.id === "faq_a")).toBe(
    a.copy.sections.find((s: any) => s.id === "faq_a"),
  );
  expect(b.translations).toBe(v.translations);
});
it("orders references only, initializes translations explicitly and removes across three locales", () => {
  let v = draft();
  for (const id of ["same", "other"])
    v = addSectionItem(v, "faq_a", { id, copy: item(id) });
  v.translations.pt_BR = structuredClone(v.translations.el);
  for (const locale of ["el", "pt_BR"]) {
    v.translations[locale].copy.sections.push({
      id: "faq_a",
      _template: "faq",
      title: "FAQ",
      description: ast,
      items: [],
    });
    v = addSectionItemTranslation(v, locale, "faq_a", "same", item());
    v = addSectionItemTranslation(v, locale, "faq_a", "other", item("other"));
  }
  const moved: any = moveSectionItem(v, "faq_a", "other", "up");
  expect(moved.copy).toBe(v.copy);
  expect(moved.translations).toBe(v.translations);
  expect(
    moved.sections
      .find((s: any) => s.id === "faq_a")
      .items.map((i: any) => i.id),
  ).toEqual(["other", "same"]);
  const next: any = removeSectionItem(moved, "faq_a", "same");
  for (const copy of [
    next.copy,
    ...Object.values(next.translations).map((t: any) => t.copy),
  ])
    expect(
      copy.sections
        .find((s: any) => s.id === "faq_a")
        .items.map((i: any) => i.id),
    ).toEqual(["other"]);
  expect(
    next.copy.sections.find((s: any) => s.id === "faq_a").items[0].answer,
  ).toBe(ast);
});
it("rejects invalid IDs, duplicates, missing selections, unsupported media/types/variants and stale translations", () => {
  const v = addSectionItem(draft(), "faq_a", { id: "same", copy: item() });
  for (const fn of [
    () => addSectionItem(v, "faq_a", { id: "same", copy: item() }),
    () => addSectionItem(v, "faq_a", { id: "Bad", copy: item("Bad") }),
    () => addSectionItem(v, "intro", { id: "x", copy: item("x") }),
    () => addSectionItem(v, "faq_a", { id: "x", copy: item("wrong") }),
    () =>
      addSectionItem(v, "faq_a", {
        id: "x",
        copy: item("x"),
        media: { src: "x" },
      }),
    () => moveSectionItem(v, "faq_a", "missing", "up"),
    () => removeSectionItem(v, "missing", "same"),
    () => setSectionVariant(v, "faq_a", "cards"),
    () => addSectionItemTranslation(v, "el", "faq_a", "stale", item("stale")),
  ])
    expect(fn).toThrow();
  expect(
    setSectionVariant(v, "faq_a", "expanded").sections.find(
      (s: any) => s.id === "faq_a",
    )?.variant,
  ).toBe("expanded");
});

it("rejects missing, stale and duplicate default item copies before structural edits", () => {
  for (const mutate of [
    (v: any) => (v.copy.sections.find((s: any) => s.id === "faq_a").items = []),
    (v: any) =>
      v.copy.sections
        .find((s: any) => s.id === "faq_a")
        .items.push(item("stale")),
    (v: any) =>
      v.copy.sections.find((s: any) => s.id === "faq_a").items.push(item()),
  ]) {
    const v: any = addSectionItem(draft(), "faq_a", {
      id: "same",
      copy: item(),
    });
    mutate(v);
    expect(() => moveSectionItem(v, "faq_a", "same", "down")).toThrow();
    expect(() =>
      addSectionItem(v, "faq_a", { id: "new", copy: item("new") }),
    ).toThrow();
  }
});
