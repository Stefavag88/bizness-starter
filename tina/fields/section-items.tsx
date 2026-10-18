import {SectionMediaControls} from './section-media';
import { createElement as h, useState } from "react";
import { sectionDefinitions } from "../../packages/content/section-registry.mjs";
import {
  addSectionItem,
  moveSectionItem,
  removeSectionItem,
  addSectionItemTranslation,
} from "../../packages/content/section-items.mjs";
import { applyComposition, RegisteredFields, useValues } from "./composition";
import { nativeRichText } from "./rich-text";
const definition = (type: string) =>
  sectionDefinitions.find((d) => d.type === type || d.nativeName === type)!;
export function newItemCopy(type: string, id: string, translated = false) {
  const d = definition(type);
  const copy: any = { id, ...d.defaultItemCopy!() };
  for (const key of Object.keys(copy)) {
    if (key === "id") continue;
    if (translated) copy[key] = "";
    if (
      d.richFields.some((f) => f.path[0] === "items" && f.path.at(-1) === key)
    )
      copy[key] = nativeRichText(copy[key]);
  }
  return copy;
}
export function itemChildFields(field: any, entry: any, index: number) {
  return (field.fields || [])
    .filter((child: any) => child.name !== "id" && child.name !== "_template")
    .map((child: any) => ({
      ...child,
      label: child.label || child.name,
      name: `${field.name}.${index}.${child.name}`,
    }));
}
export function FixedSectionItems({ input, field, tinaForm }: any) {
  const values = useValues(tinaForm);
  const match =
    /^(?:translations\.([^.]+)\.)?copy\.sections\.(\d+)\.items$/.exec(
      field.name,
    );
  if (!match) return null;
  const locale = match[1];
  const sectionCopy = (locale ? values.translations?.[locale] : values)?.copy
    ?.sections?.[Number(match[2])];
  const section = values.sections?.find((s: any) => s.id === sectionCopy?.id);
  const d = definition(section?._template);
  if (!d?.itemCopySchema) return null;
  const entries = input.value || [];
  return h(
    "div",
    {},
    ...entries
      .filter((entry: any) => section.items.some((i: any) => i.id === entry.id))
      .map((entry: any) =>
        h(
          "fieldset",
          { key: entry.id, "data-item-copy-id": entry.id },
          h("legend", {}, entry.id),
          h(RegisteredFields, {
            tinaForm,
            fields: itemChildFields(field, entry, entries.indexOf(entry)),
          }),
        ),
      ),
    ...(locale
      ? section.items
          .filter(
            (item: any) => !entries.some((entry: any) => entry.id === item.id),
          )
          .map((item: any) =>
            h(
              "button",
              {
                type: "button",
                key: item.id,
                onClick: () =>
                  applyComposition(tinaForm.finalForm, (v) =>
                    addSectionItemTranslation(
                      v,
                      locale,
                      section.id,
                      item.id,
                      newItemCopy(section._template, item.id, true),
                    ),
                  ),
              },
              "Initialize item copy " + item.id,
            ),
          )
      : []),
  );
}
export function SectionItemsControls({ tinaForm, sectionId }: any) {
  const values = useValues(tinaForm);
  const section = values.sections.find((s: any) => s.id === sectionId);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const run = (operation: any) => {
    try {
      applyComposition(tinaForm.finalForm, operation);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  };
  return h(
    "div",
    {},
    error && h("p", { role: "alert" }, error),
    ...(section.items || []).map((item: any, index: number) =>
      h(
        "div",
        { key: item.id, "data-item-id": item.id },
        h("span", {}, item.id),
        section._template==='gallery' && h(SectionMediaControls,{tinaForm,sectionId,itemId:item.id}),
        ...(["up", "down"] as const).map((direction) =>
          h(
            "button",
            {
              type: "button",
              key: direction,
              disabled:
                direction === "up"
                  ? index === 0
                  : index === section.items.length - 1,
              onClick: () =>
                run((v: any) =>
                  moveSectionItem(v, sectionId, item.id, direction),
                ),
            },
            "Move " + item.id + " " + direction,
          ),
        ),
        h(
          "button",
          { type: "button", onClick: () => setPending(item.id) },
          "Remove item " + item.id,
        ),
        pending === item.id &&
          h(
            "div",
            {
              role: "group",
              "aria-label": "Confirm removal of item " + item.id,
            },
            h("p", {}, "Remove this item and its copy from every translation?"),
            h(
              "button",
              {
                type: "button",
                onClick: () => {
                  run((v: any) => removeSectionItem(v, sectionId, item.id));
                  setPending(null);
                },
              },
              "Confirm item removal",
            ),
            h(
              "button",
              { type: "button", onClick: () => setPending(null) },
              "Cancel item removal",
            ),
          ),
      ),
    ),
    section._template==='gallery'?h(SectionMediaControls,{tinaForm,sectionId,adding:true}):h(
      "button",
      {
        type: "button",
        onClick: () => {
          const id = "item_" + crypto.randomUUID().replaceAll("-", "");
          run((v: any) =>
            addSectionItem(v, sectionId, {
              id,
              copy: newItemCopy(section._template, id),
            }),
          );
        },
      },
      "Add item to " + sectionId,
    ),
  );
}
