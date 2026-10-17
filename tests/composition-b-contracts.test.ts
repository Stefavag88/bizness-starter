import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { normalizePageDocument } from "../packages/content/documents.mjs";
import { nativeProjection, beforeSubmit } from "../tina/validation";
import { project } from "./fixtures/content/factory";

function draft(): any {
  const v = JSON.parse(readFileSync("content/pages/about.json", "utf8"));
  v.sections.push({
    id: "faq",
    _template: "faq",
    variant: "expanded",
    enabled: true,
    appearance: { surface: "default" },
    items: [{ id: "one" }, { id: "two" }],
  });
  v.copy.sections.push({
    id: "faq",
    _template: "faq",
    title: "FAQ",
    description: "",
    items: [
      { id: "two", question: "Two", answer: "Second" },
      { id: "one", question: "One", answer: "First" },
    ],
  });
  return v;
}
it("accepts list variants, optional whole-section translation and rejects bad membership and empty enabled lists", () => {
  expect(normalizePageDocument(draft()).sections.at(-1)?._template).toBe("faq");
  for (const change of [
    (v: any) => v.sections.at(-1).items.push({ id: "one" }),
    (v: any) => v.copy.sections.at(-1).items.pop(),
    (v: any) =>
      v.copy.sections
        .at(-1)
        .items.push({ id: "stale", question: "?", answer: "Answer" }),
    (v: any) => (v.copy.sections.at(-1).items[0].answer = " "),
    (v: any) => (v.sections.at(-1).variant = "cards"),
    (v: any) => {
      v.sections.at(-1).items = [];
      v.copy.sections.at(-1).items = [];
    },
  ]) {
    const v = draft();
    change(v);
    expect(() => normalizePageDocument(v)).toThrow();
  }
});
it("serializes nested rich ASTs on a detached projection and returns original values", () => {
  const v = draft();
  const ast = {
    type: "root",
    children: [
      {
        type: "p",
        children: [
          { text: "Bold", bold: true },
          { type: "a", url: "/contact", children: [{ text: "Contact" }] },
        ],
      },
    ],
  };
  v.copy.sections.at(-1).items[0].answer = ast;
  const p = nativeProjection(v, project);
  expect(p.copy.sections.at(-1).items[0].answer).toContain("**Bold**");
  expect(p.copy.sections.at(-1).items[0].answer).toContain(
    "[Contact](/contact)",
  );
  expect(beforeSubmit(v, "page", project, v)).toBe(v);
  expect(v.copy.sections.at(-1).items[0].answer).toBe(ast);
  v.copy.sections.at(-1).items[0].answer = {
    type: "root",
    children: [{ type: "html", value: "<script/>" }],
  };
  expect(() => nativeProjection(v, project)).toThrow();
});

it("uses real native defaults and exposes registered fixed nested editor fields", async () => {
  const { appendSection, copyChildFields } =
    await import("../tina/fields/composition");
  const { sectionCopyTemplates } = await import("../tina/fields/section-copy");
  const { itemChildFields } = await import("../tina/fields/section-items");
  const v = appendSection(
    JSON.parse(readFileSync("content/pages/about.json", "utf8")),
    "faq",
    "intro",
  );
  expect(v.sections[1].items).toEqual([]);
  const copy = v.copy.sections.at(-1)!;
  expect(copy.description).toMatchObject({ type: "root" });
  const children = copyChildFields(
    { name: "translations.el.copy.sections", templates: sectionCopyTemplates },
    copy,
    2,
  );
  const field = children.find((f: any) => f.name.endsWith(".items"));
  expect(
    itemChildFields(field, { id: "same", question: "Q", answer: "" }, 0).map(
      (f: any) => f.name,
    ),
  ).toEqual([
    "translations.el.copy.sections.2.items.0.question",
    "translations.el.copy.sections.2.items.0.answer",
  ]);
});

it("projects shared order by ID in each locale and omits absent optional sections", async () => {
  const { localizeContent } = await import("../packages/content/localize.mjs");
  const { normalizedSettings } = await import("./fixtures/content/factory");
  const page = normalizePageDocument(draft());
  const source: any = {
    settings: normalizedSettings(),
    pages: [page],
    offerings: [],
    people: [],
    articles: [],
    campaigns: [],
    now: "2026-10-18T00:00:00Z",
  };
  expect(
    (
      localizeContent(source, "en", project).pages[0].sections.find(
        (s) => s.id === "faq",
      )!.copy as any
    ).items.map((i: any) => i.question),
  ).toEqual(["One", "Two"]);
  expect(
    localizeContent(source, "el", project).pages[0].sections.some(
      (s) => s.id === "faq",
    ),
  ).toBe(false);
  page.translations.el.copy.sections.faq = {
    title: "Questions",
    description: "",
    items: [
      { id: "two", question: "Deux", answer: "Second" },
      { id: "one", question: "Un", answer: "First" },
    ],
  };
  expect(
    (
      localizeContent(source, "el", project).pages[0].sections.find(
        (s) => s.id === "faq",
      )!.copy as any
    ).items.map((i: any) => i.question),
  ).toEqual(["Un", "Deux"]);
});
it("binds actual nested correction editors, batches item changes once and keeps native defaults opaque", async () => {
  const {
    appendSection,
    applyComposition,
    pageCorrectionFields,
    copyChildFields,
    openPageCorrection,
  } = await import("../tina/fields/composition");
  const { sectionCopyTemplates } = await import("../tina/fields/section-copy");
  const { newItemCopy, itemChildFields, FixedSectionItems } =
    await import("../tina/fields/section-items");
  const { addSectionItem } =
    await import("../packages/content/section-items.mjs");
  const values = appendSection(
    JSON.parse(readFileSync("content/pages/about.json", "utf8")),
    "steps",
    "intro",
  );
  const id = values.sections[1].id;
  const copy = newItemCopy("steps", "item_new");
  expect(copy.body).toMatchObject({ type: "root", children: [{ type: "p" }] });
  let batches = 0;
  const changes: any[] = [];
  const form = {
    getState: () => ({ values }),
    batch: (fn: any) => {
      batches++;
      fn();
    },
    change: (...args: any[]) => changes.push(args),
  };
  applyComposition(form, (v) =>
    addSectionItem(v, id, { id: "item_new", copy }),
  );
  expect(batches).toBe(1);
  expect(changes.map((c) => c[0])).toEqual(["sections", "copy"]);
  expect(changes[1][1].sections.at(-1).items[0].body).toBe(copy.body);
  const fields = copyChildFields(
    pageCorrectionFields([
      {
        name: "translations.el.copy.sections",
        templates: sectionCopyTemplates,
      },
    ])[0],
    values.copy.sections.at(-1),
    3,
  );
  const items = fields.find((f: any) => f.name.endsWith(".items"));
  expect(items.ui.component).toBe(FixedSectionItems);
  const nested = itemChildFields(items, copy, 0);
  expect(nested.map((f: any) => [f.name, f.type])).toEqual([
    ["translations.el.copy.sections.3.items.0.title", "string"],
    ["translations.el.copy.sections.3.items.0.body", "rich-text"],
  ]);
  const actions: any[] = [];
  openPageCorrection(
    { id: "page" },
    { dispatch: (action: any) => actions.push(action) },
    nested[1].name,
  );
  expect(actions[0].value.fieldName).toBe(
    "translations.el.copy.sections.3.items.0.body",
  );
});
