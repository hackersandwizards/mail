import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { colors, tokens } from "@hackersandwizards/brand/tokens";
import { Image, MAX_IMAGE_WIDTH } from "../components/Image";
import type { BriefProps } from "../mails/Brief";
import { renderBrief } from "../scripts/render";
import data from "../catalog/mails/brief-bild.json";

const tint = colors["--color-tint"];
const muted = colors["--color-muted"];
const corner = tokens["--radius-sm"];
const props = { src: "https://example.com/card.png", alt: "Vorschaubild", width: 280, height: 152 };

/** The style attribute of the first element of that tag, as a property map. */
function style(html: string, tag: string): Record<string, string> {
  const raw = html.match(new RegExp(`<${tag}\\b[^>]*\\bstyle="([^"]*)"`))?.[1] ?? "";
  return Object.fromEntries(
    raw
      .split(";")
      .filter(Boolean)
      .map((d) => d.split(":").map((s) => s.trim()) as [string, string]),
  );
}
/** The image's cell: the one cell carrying a bgcolor. */
const cell = (html: string) => html.match(/<td\b[^>]*\bbgcolor="[^"]*"[^>]*>/)?.[0] ?? "";
const attr = (html: string, tag: string, name: string) =>
  html.match(new RegExp(`<${tag}\\b[^>]*\\b${name}="([^"]*)"`))?.[1];

describe("Image keeps its box while images are blocked", async () => {
  const alone = renderToStaticMarkup(<Image {...props} href="https://example.com/" />);
  const inMail = (await renderBrief(data as BriefProps)).html;

  for (const [where, html] of [
    ["alone", alone],
    ["in the Brief", inMail],
  ] as const) {
    test(`${where}: whole-pixel width and height in attribute and style, never auto`, () => {
      const box = data.items[0].image!;
      expect(attr(html, "img", "width")).toBe(String(where === "alone" ? 280 : box.width));
      expect(attr(html, "img", "height")).toBe(String(where === "alone" ? 152 : box.height));
      const img = style(html, "img");
      expect(img.width).toBe(`${attr(html, "img", "width")}px`);
      expect(img.height).toBe(`${attr(html, "img", "height")}px`);
      expect(html).not.toMatch(/height:\s*auto|height="auto"/);
    });

    test(`${where}: the tint behind the image and its cell`, () => {
      expect(style(html, "img")["background-color"]).toBe(tint);
      expect(cell(html)).toContain(`bgcolor="${tint}"`);
      expect(cell(html)).toContain(`background-color:${tint}`);
      expect(cell(html)).toMatch(/width:\d+px;height:\d+px/);
    });

    test(`${where}: alt text in Arial 12/16, muted, without the link's underline`, () => {
      const img = style(html, "img");
      expect(img["font-family"]).toStartWith("Arial");
      expect(img["font-size"]).toBe("12px");
      expect(img["line-height"]).toBe("16px");
      expect(img.color).toBe(muted);
      expect(img["text-decoration"]).toBe("none");
      const link = html.match(/<a\b[^>]*>(?=<img)/)?.[0] ?? "";
      expect(link).toContain("text-decoration:none");
      expect(link).toContain(`color:${muted}`);
    });

    test(`${where}: image and cell in the small corner`, () => {
      expect(style(html, "img")["border-radius"]).toBe(corner);
      expect(cell(html)).toContain(`border-radius:${corner}`);
    });
  }

  test("refuses a size that is no whole pixel, too wide for a phone, or an image without alt", () => {
    expect(() => renderToStaticMarkup(<Image {...props} width={300.5} />)).toThrow("whole number");
    expect(() => renderToStaticMarkup(<Image {...props} height={0} />)).toThrow("whole number");
    expect(() => renderToStaticMarkup(<Image {...props} width={MAX_IMAGE_WIDTH + 1} />)).toThrow(
      "phone column",
    );
    expect(() => renderToStaticMarkup(<Image {...props} alt=" " />)).toThrow("no alt text");
  });
});
