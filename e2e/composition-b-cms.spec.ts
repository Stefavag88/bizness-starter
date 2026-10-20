import { test, expect, type Page, type Locator } from "@playwright/test";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
} from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { createCmsSources } from "./helpers/cms-source-ownership";
import { createCmsEvidence } from "./helpers/cms-evidence";
import { createOwnedMedia } from "./helpers/owned-media";
const cms = process.env.E2E_CMS_URL;
test.skip(!cms, "Opt in against the owned indexed native CMS.");
test.describe.configure({ mode: "serial", timeout: 300000 });
const hash = (path: string) =>
  createHash("sha256").update(readFileSync(path)).digest("hex");
async function open(page: Page, path: string) {
  await page.goto(
    cms + "/cms/index.html?compositionB=" + Date.now() + "#/" + path,
  );
  await expect(
    page
      .getByRole("button", { name: /^(Enter Edit Mode|Save|Create New)$/ })
      .first(),
  ).toBeVisible({ timeout: 30000 });
  const enter = page.getByRole("button", {
    name: "Enter Edit Mode",
    exact: true,
  });
  if (await enter.isVisible()) await enter.click();
}
async function root(page: Page) {
  await page
    .getByRole("navigation", { name: "breadcrumb" })
    .getByRole("button")
    .nth(1)
    .click();
}
async function copyEditor(page: Page, locale = "en") {
  if (locale === "en")
    await page.getByRole("button", { name: "Section content", exact: true }).click();
  else {
    await page
      .getByRole("button", { name: "Translations", exact: true })
      .click();
    await page.getByRole("button", { name: "Ελληνικά", exact: true }).click();
    await page
      .getByRole("button", { name: "translations.el.copy", exact: true })
      .click();
  }
}
async function rich(page: Page, editor: Locator, text: string, linked = false) {
  await editor.click();
  await editor.focus();
  await expect(editor).toBeFocused();
  await page.waitForTimeout(400);
  await page.keyboard.press("Control+a");
  await page.waitForTimeout(400);
  await page.keyboard.press("Backspace");
  if (!text) return;
  await page.keyboard.type(text, { delay: 10 });
  await page.keyboard.press("Home");
  await page.keyboard.press("Shift+End");
  await page.waitForTimeout(250);
  await page.keyboard.press("Control+b");
  await expect(editor.locator("strong")).toHaveText(text);
  if (linked) {
    await page.keyboard.press("Control+k");
    await page
      .getByRole("textbox", { name: "Paste link", exact: true })
      .fill("/contact");
    await page.getByRole("button", { name: "OK", exact: true }).click();
    await expect(editor.locator("a")).toHaveAttribute("href", "/contact");
    await page.keyboard.press("Escape");
  }
}
async function pick(page: Page, control: Locator, name: string) {
  const selected = control.locator("img");
  if (await selected.count()) await control.locator("button").first().click();
  else await control.getByRole("button", { name: /Drag 'n' drop/ }).click();
  await page.getByText(name, { exact: true }).click();
  await page.getByRole("button", { name: "Insert", exact: true }).click();
}
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9S8AAAAASUVORK5CYII=",
  "base64",
);

test("native nested authoring saves, rejected-save correction, media selection and owned restoration", async ({
  page,
  context,
}) => {
  page.setDefaultTimeout(15000);
  mkdirSync(".generated/composition-b-cms", { recursive: true });
  const directory = mkdtempSync(".generated/composition-b-cms/run-");
  const evidence = createCmsEvidence(directory);
  const name = "composition-b-" + Date.now(),
    path = "content/pages/" + name + ".json";
  const sources = createCmsSources([path], join(directory, "pages"), {
    allowCreate: true,
  });
  const names = [name + "-a.png", name + "-b.png"];
  const media = names.map((n) =>
    createOwnedMedia("apps/site/public/uploads/" + n, join(directory, "media")),
  );
  const baseline = {
    schema: hash("tina/__generated__/_schema.json"),
    descriptor: hash(".generated/cms.json"),
  };
  const seeds = ["home", "privacy", "contact"]
    .map((n) => "content/pages/" + n + ".json")
    .concat("content/settings/site.json");
  const seedBytes = seeds.map((p) => readFileSync(p));
  const site = await context.newPage();
  const saves: any[] = [];
  const requests: any[] = [];
  page.on("request", (r) => {
    if (
      r.method() === "POST" &&
      /(?:create|update|delete)Document/.test(r.postData() || "")
    )
      requests.push(r.postDataJSON());
  });
  const section = (id: string) =>
    page.locator('[data-section-id="' + id + '"]');
  const copy = (id: string) => page.locator('[data-copy-id="' + id + '"]');
  const item = (id: string) => page.locator('[data-item-copy-id="' + id + '"]');
  let ids: Record<string, string> = {},
    items: Record<string, string[]> = {};
  async function save(
    operation: "create" | "update",
    predicate: (d: any) => boolean,
  ) {
    console.log("Native save", operation);
    sources.assertUnchanged();
    const responsePromise = page.waitForResponse(
      (r) =>
        r.request().method() === "POST" &&
        (r.request().postData() || "").includes(operation + "Document"),
    );
    await page.getByRole("button", { name: "Save", exact: true }).click();
    const response = await responsePromise;
    expect((await response.json()).errors || []).toEqual([]);
    const mutation = {
      ...response.request().postDataJSON().variables,
      operation,
    };
    await evidence.captureNative(
      sources,
      path,
      mutation,
      JSON.parse(readFileSync("tina/__generated__/_schema.json", "utf8")),
      predicate,
    );
    saves.push({
      mutation,
      bytes: readFileSync(path, "base64"),
      sha256: hash(path),
    });
    writeFileSync(
      join(directory, "saves.json"),
      JSON.stringify(saves, null, 2),
    );
  }
  async function reload() {
    await open(page, "collections/edit/page/" + name);
    await expect(
      page.getByRole("button", { name: "Save", exact: true }),
    ).toBeDisabled();
  }
  async function reject(label: string, message: RegExp) {
    console.log("Expected rejected save", label);
    const count = requests.length,
      bytes = readFileSync(path);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText(message).first()).toBeVisible();
    expect(requests.length).toBe(count);
    expect(readFileSync(path)).toEqual(bytes);
    sources.assertUnchanged();
    writeFileSync(
      join(directory, label + ".json"),
      JSON.stringify(
        {
          mutationsBefore: count,
          mutationsAfter: requests.length,
          sha256: hash(path),
          alert: await page.locator("body").innerText(),
        },
        null,
        2,
      ),
    );
    await page.screenshot({
      path: join(directory, label + ".png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Close", exact: true }).click();
  }
  try {
    for (const guard of media) guard.create(png);
    await open(page, "collections/page");
    await page.getByRole("button", { name: "Create New", exact: true }).click();
    await page.getByRole("menuitem", { name: "standard", exact: true }).click();
    await page.locator("[name=contentId]").fill(name.replaceAll("-", "_"));
    await page.locator("[name=slug]").fill(name);
    await page.getByRole("textbox", { name: "My_Document" }).fill(name);
    await page.getByRole("button", { name: "Page title and SEO", exact: true }).click();
    await page.locator('[name="meta.title"]').fill("Composition B acceptance");
    await root(page);
    await save(
      "create",
      (d) => d.status === "draft" && d.sections.length === 1,
    );
    await reload();
    await expect(page.locator("[name=contentId]")).toHaveAttribute(
      "readonly",
      "",
    );
    await expect(page.locator("[name=slug]")).toHaveAttribute("readonly", "");
    await expect(
      section("intro").getByRole("button", {
        name: "Remove intro",
        exact: true,
      }),
    ).toBeDisabled();
    await expect(section("intro").getByRole("checkbox")).toBeDisabled();
    let after = "intro";
    for (const [key, type] of Object.entries({
      faq1: "faq",
      faq2: "faq",
      steps: "steps",
      media: "media-text",
      gallery: "gallery",
    })) {
      await page
        .getByRole("combobox", {
          name: "Add section after " + after,
          exact: true,
        })
        .selectOption(type);
      const id = await page
        .locator("[data-section-id]")
        .last()
        .getAttribute("data-section-id");
      ids[key] = id!;
      after = id!;
      await expect(section(id!).getByRole("checkbox")).not.toBeChecked();
      await section(id!).getByRole("checkbox").check();
    }
    for (const key of ["faq1", "faq2", "steps"]) {
      for (let i = 0; i < (key === "faq2" ? 1 : 2); i++)
        await section(ids[key])
          .getByRole("button", { name: "Add item to " + ids[key], exact: true })
          .click();
      items[key] = await section(ids[key])
        .locator("[data-item-id]")
        .evaluateAll((es) => es.map((e) => e.getAttribute("data-item-id")!));
    }
    await pick(
      page,
      section(ids.media).locator("[data-section-media]"),
      names[0],
    );
    await section(ids.media)
      .getByLabel("Shared crop", { exact: false })
      .selectOption("top");
    for (const n of names)
      await pick(
        page,
        section(ids.gallery).locator(
          '[data-section-media="' + ids.gallery + '"]',
        ),
        n,
      );
    items.gallery = await section(ids.gallery)
      .locator("[data-item-id]")
      .evaluateAll((es) => es.map((e) => e.getAttribute("data-item-id")!));
    for (const [key, variant] of Object.entries({
      faq1: "expanded",
      steps: "cards",
      media: "reversed",
      gallery: "featured",
    }))
      await section(ids[key])
        .getByLabel("Layout", { exact: false })
        .selectOption(variant);
    await page
      .getByRole("button", { name: "Initialize Ελληνικά copy", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Translations", exact: true })
      .click();
    await page.getByRole("button", { name: "Ελληνικά", exact: true }).click();
    await page
      .getByRole("button", { name: "translations.el.meta", exact: true })
      .click();
    await page
      .locator('[name="translations.el.meta.title"]')
      .fill("Ελληνική αποδοχή");
    await root(page);
    for (const locale of ["en", "el"]) {
      console.log("Native locale stage", locale);
      await copyEditor(page, locale);
      if (locale === "el")
        for (const id of Object.values(ids))
          await page
            .getByRole("button", {
              name: "Add translation copy for " + id,
              exact: true,
            })
            .click();
      await copy("intro")
        .locator('input[name$=".title"]')
        .fill(locale + " hero");
      for (const [key, id] of Object.entries(ids)) {
        await copy(id)
          .locator('input[name$=".title"]')
          .first()
          .fill(locale + " " + key);
        if (locale === "el" && items[key])
          for (const itemId of items[key])
            await copy(id)
              .getByRole("button", {
                name: "Initialize item copy " + itemId,
                exact: true,
              })
              .click();
        for (const [index, itemId] of (items[key] || []).entries()) {
          if (key === "gallery") {
            await item(itemId)
              .locator('input[name$=".alt"]')
              .fill(
                locale === "el" && index === 1
                  ? ""
                  : locale + " image " + index,
              );
            await rich(
              page,
              item(itemId).locator("[contenteditable=true]"),
              locale + " caption " + index,
              true,
            );
          } else {
            await item(itemId)
              .locator("input")
              .fill(locale + " " + key + " item " + index);
            await rich(
              page,
              item(itemId).locator("[contenteditable=true]"),
              locale === "en" && key === "faq1" && index === 1
                ? ""
                : locale + " " + key + " answer " + index,
              true,
            );
          }
        }
      }
      await rich(
        page,
        copy(ids.media).locator("[contenteditable=true]"),
        locale + " retained media body",
        true,
      );
      await copy(ids.media)
        .getByRole("button", { name: "link", exact: true })
        .click();
      await page.locator('input[name$=".link.label"]').fill(locale + " CTA");
      await page.locator('input[name$=".link.href"]').fill("/contact");
      await root(page);
      await copyEditor(page, locale);
      await copy(ids.media)
        .getByRole("button", { name: "image", exact: true })
        .click();
      await page
        .locator('input[name$=".image.alt"]')
        .fill(locale + " media alt");
      await rich(
        page,
        page.locator("[contenteditable=true]"),
        locale + " media caption",
        true,
      );
      await root(page);
    }
    await reject("incomplete-answer", /Item prose must contain text/);
    await copyEditor(page);
    await expect(copy(ids.media).locator("strong")).toHaveText(
      "en retained media body",
    );
    await rich(
      page,
      item(items.faq1[1]).locator("[contenteditable=true]"),
      "en faq1 answer 1",
      true,
    );
    await root(page);
    await reject("missing-localized-alt", /alt|Too small: expected string/);
    await copyEditor(page, "el");
    await expect(copy(ids.media).locator("strong")).toHaveText(
      "el retained media body",
    );
    await item(items.gallery[1])
      .locator('input[name$=".alt"]')
      .fill("el image 1");
    await root(page);
    await section(ids.faq1)
      .getByRole("button", {
        name: "Move " + items.faq1[1] + " up",
        exact: true,
      })
      .click();
    await section(ids.steps)
      .getByRole("button", {
        name: "Move " + items.steps[1] + " up",
        exact: true,
      })
      .click();
    await section(ids.gallery)
      .getByRole("button", {
        name: "Move " + items.gallery[1] + " up",
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Move " + ids.faq2 + " down", exact: true })
      .click();
    await section(ids.faq2).getByRole("checkbox").uncheck();
    await section(ids.faq2).getByRole("checkbox").check();
    await save(
      "update",
      (d) =>
        d.sections.length === 6 &&
        d.sections.find((s: any) => s.id === ids.faq1).items[0].id ===
          items.faq1[1] &&
        d.copy.sections
          .find((s: any) => s.id === ids.faq1)
          .items.every(
            (i: any) =>
              i.answer.includes("**") && i.answer.includes("/contact"),
          ) &&
        d.translations.el.copy.sections.find((s: any) => s.id === ids.gallery)
          .items[1].alt === "el image 1",
    );
    await reload();
    for (const [key, variant] of Object.entries({
      faq1: "expanded",
      steps: "cards",
      media: "reversed",
      gallery: "featured",
    }))
      await expect(
        section(ids[key]).getByLabel("Layout", { exact: false }),
      ).toHaveValue(variant);
    expect(
      await page
        .locator("[data-section-id]")
        .evaluateAll((es) => es.map((e) => e.getAttribute("data-section-id"))),
    ).toEqual(["intro", ids.faq1, ids.steps, ids.faq2, ids.media, ids.gallery]);
    const beforeCancel = readFileSync(path);
    const beforeRequests = requests.length;
    await section(ids.faq1)
      .getByRole("button", {
        name: "Remove item " + items.faq1[0],
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Cancel item removal", exact: true })
      .click();
    await expect(section(ids.faq1).locator("[data-item-id]")).toHaveCount(2);
    await page
      .getByRole("button", { name: "Remove " + ids.faq2, exact: true })
      .click();
    await page
      .getByRole("button", { name: "Cancel removal", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Save", exact: true }),
    ).toBeDisabled();
    expect(requests.length).toBe(beforeRequests);
    expect(readFileSync(path)).toEqual(beforeCancel);
    writeFileSync(
      join(directory, "cancel.json"),
      JSON.stringify({
        actualItemCancel: true,
        actualSectionCancel: true,
        mutations: requests.length - beforeRequests,
        bytesUnchanged: true,
      }),
    );
    await page
      .getByRole("combobox", { name: "status", exact: true })
      .selectOption("published");
    await page
      .getByRole("button", { name: "Translations", exact: true })
      .click();
    await page.getByRole("button", { name: "Ελληνικά", exact: true }).click();
    await page
      .getByRole("combobox", { name: "translations.el.status", exact: true })
      .selectOption("published");
    await root(page);
    await save(
      "update",
      (d) =>
        d.status === "published" && d.translations.el.status === "published",
    );
    await reload();
    for (const locale of ["en", "el"]) {
      console.log("Native locale stage", locale);
      await site.goto("/" + locale + "/" + name);
      for (const [key, id] of Object.entries(ids))
        await expect(site.locator("#" + id)).toHaveText(locale + " " + key);
      expect(
        await site
          .locator("main section[aria-labelledby]")
          .evaluateAll((es) =>
            es
              .map((e) => e.getAttribute("aria-labelledby"))
              .filter((id) => id !== "intro"),
          ),
      ).toEqual([ids.faq1, ids.steps, ids.faq2, ids.media, ids.gallery]);
      await expect(
        site.locator('[aria-labelledby="' + ids.steps + '"] ol li').first(),
      ).toContainText(locale + " steps answer 1");
      const gallery = site.locator('[aria-labelledby="' + ids.gallery + '"]');
      await expect(
        gallery.locator("[data-gallery-item]").first(),
      ).toHaveAttribute("data-gallery-item", items.gallery[1]);
      await expect(gallery.locator("img").first()).toHaveAttribute(
        "src",
        "/uploads/" + names[1],
      );
      await expect(gallery.locator("img").first()).toHaveAttribute(
        "alt",
        locale + " image 1",
      );
      await expect(gallery.locator("figcaption a").first()).toHaveAttribute(
        "href",
        "/" + locale + "/contact",
      );
      await expect(
        site.locator('[aria-labelledby="' + ids.faq1 + '"] strong').first(),
      ).toHaveText(locale + " faq1 answer 1");
      await page.screenshot({
        path: join(directory, locale + "-saved-native.png"),
        fullPage: true,
      });
      await site.screenshot({
        path: join(directory, locale + "-public.png"),
        fullPage: true,
      });
    }
    await pick(
      page,
      section(ids.gallery).locator(
        '[data-section-media="' + items.gallery[1] + '"]',
      ),
      names[0],
    );
    await section(ids.media)
      .locator("[data-section-media] button")
      .nth(1)
      .click();
    await section(ids.gallery)
      .getByRole("button", {
        name: "Remove item " + items.gallery[0],
        exact: true,
      })
      .click();
    await page
      .getByRole("button", { name: "Confirm item removal", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Remove " + ids.faq2, exact: true })
      .click();
    await page
      .getByRole("button", { name: "Confirm removal", exact: true })
      .click();
    await save(
      "update",
      (d) =>
        !d.sections.some((s: any) => s.id === ids.faq2) &&
        !Object.hasOwn(
          d.sections.find((s: any) => s.id === ids.media),
          "media",
        ) &&
        [d.copy, d.translations.el.copy].every((c) => {
          const m = c.sections.find((s: any) => s.id === ids.media);
          return (
            !Object.hasOwn(m, "image") &&
            m.body.includes("retained media body") &&
            m.link.href === "/contact" &&
            !c.sections.some((s: any) => s.id === ids.faq2) &&
            c.sections.find((s: any) => s.id === ids.gallery).items.length === 1
          );
        }) &&
        d.sections.find((s: any) => s.id === ids.gallery).items[0].media.src ===
          "/uploads/" + names[0],
    );
    await reload();
    for (const locale of ["en", "el"]) {
      console.log("Native locale stage", locale);
      await copyEditor(page, locale);
      await expect(copy(ids.media).locator("strong")).toHaveText(
        locale + " retained media body",
      );
      await copy(ids.media)
        .getByRole("button", { name: "image", exact: true })
        .click();
      await expect(page.locator('input[name$=".image.alt"]')).toHaveValue("");
      await root(page);
      await site.goto("/" + locale + "/" + name);
      await expect(
        site.locator('[aria-labelledby="' + ids.media + '"] img'),
      ).toHaveCount(0);
      await expect(
        site.locator('[aria-labelledby="' + ids.gallery + '"] img'),
      ).toHaveAttribute("src", "/uploads/" + names[0]);
    }
    for (let i = 0; i < media.length; i++) {
      expect(media[i].owns()).toBe(true);
      expect(readFileSync("apps/site/public/uploads/" + names[i])).toEqual(png);
    }
    expect({
      schema: hash("tina/__generated__/_schema.json"),
      descriptor: hash(".generated/cms.json"),
    }).toEqual(baseline);
    expect(requests.length).toBe(4);
    writeFileSync(
      join(directory, "acceptance.json"),
      JSON.stringify(
        {
          name,
          ids,
          items,
          saves: saves.length,
          requests,
          baseline,
          mediaFixtureOrigin:
            "Node predetermined literal PNG bytes followed by actual native picker selection; no upload claim",
          mediaHashes: names.map((n) => ({
            name: n,
            sha256: hash("apps/site/public/uploads/" + n),
          })),
        },
        null,
        2,
      ),
    );
  } finally {
    console.log("Restore Page before media", directory);
    // A Page restore conflict intentionally prevents deleting its media dependencies.
    await sources.restore(() => site.close());
    for (const guard of media) guard.restore();
    for (let i = 0; i < seeds.length; i++)
      expect(readFileSync(seeds[i])).toEqual(seedBytes[i]);
    expect(existsSync(path)).toBe(false);
    for (const n of names)
      expect(existsSync("apps/site/public/uploads/" + n)).toBe(false);
    writeFileSync(
      join(directory, "restoration.json"),
      JSON.stringify(
        {
          pageAbsent: true,
          mediaAbsent: true,
          seedsByteExact: true,
          pageBackup: sources.backup,
          mediaBackups: media.map((g) => g.backup),
        },
        null,
        2,
      ),
    );
  }
});

test("native required hero, privacy, contact and saved identities remain protected without mutations", async ({
  page,
  context,
}) => {
  const paths = ["home", "privacy", "contact"].map(
    (n) => "content/pages/" + n + ".json",
  );
  const originals = paths.map((p) => readFileSync(p));
  let mutations = 0;
  page.on("request", (r) => {
    if (
      r.method() === "POST" &&
      /(?:create|update|delete)Document/.test(r.postData() || "")
    )
      mutations++;
  });
  mkdirSync(".generated/composition-b-cms", { recursive: true });
  const directory = mkdtempSync(".generated/composition-b-cms/protected-");
  const site = await context.newPage();
  try {
    for (const name of ["home", "privacy", "contact"]) {
      await open(page, "collections/edit/page/" + name);
      await expect(page.locator("[name=contentId]")).toHaveAttribute(
        "readonly",
        "",
      );
      await expect(page.locator("[name=slug]")).toHaveAttribute("readonly", "");
      const hero = page.locator('[data-section-id="intro"]');
      await expect(hero.getByRole("checkbox")).toBeDisabled();
      await expect(
        hero.getByRole("button", { name: "Remove intro", exact: true }),
      ).toBeDisabled();
      await expect(
        hero.getByRole("button", { name: "Move intro down", exact: true }),
      ).toBeDisabled();
      if (name === "privacy") {
        const required = page.locator('[data-section-id="privacy_details"]');
        await expect(required.getByRole("checkbox")).toBeChecked();
        await expect(required.getByRole("checkbox")).toBeDisabled();
        await expect(
          required.getByRole("button", {
            name: "Remove privacy_details",
            exact: true,
          }),
        ).toBeDisabled();
      }
      if (name === "contact") {
        await expect(
          page.getByRole("button", { name: /Remove.*form/i }),
        ).toHaveCount(0);
        await site.goto("/en/contact");
        await expect(site.locator("main form")).toHaveCount(1);
      }
      await expect(
        page.getByRole("button", { name: "Save", exact: true }),
      ).toBeDisabled();
      await page.screenshot({
        path: join(directory, name + ".png"),
        fullPage: true,
      });
    }
    expect(mutations).toBe(0);
    for (let i = 0; i < paths.length; i++)
      expect(readFileSync(paths[i])).toEqual(originals[i]);
    writeFileSync(
      join(directory, "acceptance.json"),
      JSON.stringify(
        {
          mutations,
          byteExact: true,
          required: ["hero", "privacy_details", "contact-template-form"],
          immutable: ["contentId", "slug"],
        },
        null,
        2,
      ),
    );
  } finally {
    await site.close();
  }
});
