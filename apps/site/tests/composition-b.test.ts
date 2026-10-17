import { it, expect } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { sectionRenderer } from "../src/templates/sections";
it.each([
  ["faq", "default"],
  ["faq", "expanded"],
  ["steps", "default"],
  ["steps", "cards"],
])(
  "renders actual %s/%s semantics with safe linked rich copy",
  async (type, variant) => {
    const container = await AstroContainer.create();
    const section = {
      id: "example",
      _template: type,
      variant,
      appearance: { surface: "muted" },
      copy: {
        title: "Section title",
        description: "An **introduction**",
        items: [
          type === "faq"
            ? {
                id: "one",
                question: "A question?",
                answer: "**Answer** [Contact](/contact)\n\n<script>alert(1)</script>",
              }
            : {
                id: "one",
                title: "First step",
                body: "**Answer** [Contact](/contact)\n\n<script>alert(1)</script>",
              },
        ],
      },
    };
    const html = await container.renderToString(
      sectionRenderer(type, variant) as any,
      { props: { section, locale: "en" } },
    );
    expect(html).toContain('<h2 id="example">Section title</h2>');
    expect(html).toContain("<strong>Answer</strong>");
    expect(html).toContain('href="/en/contact"');
    expect(html).not.toMatch(/<a[^>]*>(?:(?!<\/a>)[\s\S])*<a/);
    expect(html).not.toContain("<script");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<h1");
    if (type === "faq") {
      expect(html).toContain(variant === "default" ? "<summary" : "<h3");
      expect(html.includes("<details")).toBe(variant === "default");
    } else {
      expect(html).toContain("<ol");
      expect(html).toContain("<li");
      expect(html).toContain("<h3>First step</h3>");
      expect(html.includes("steps-cards")).toBe(variant === "cards");
    }
  },
);
