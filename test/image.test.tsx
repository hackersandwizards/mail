import { assert, describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { colors, tokens } from "@hackersandwizards/brand/tokens";
import { Image, MAX_IMAGE_WIDTH } from "../components/Image";
import type { BriefProps } from "../mails/Brief";
import { renderBrief } from "../scripts/render";
import data from "../catalog/mails/brief-bild.json";
import { attr, style } from "./markup";

const tint = colors["--color-tint"];
const muted = colors["--color-muted"];
const corner = tokens["--radius-sm"];
const props = { src: "https://example.com/card.png", alt: "Vorschaubild", width: 280, height: 152 };

/** The image's cell: the one cell carrying a bgcolor. */
const cell = (html: string) => html.match(/<td\b[^>]*\bbgcolor="[^"]*"[^>]*>/)?.[0] ?? "";

const alone = renderToStaticMarkup(<Image {...props} href="https://example.com/" />);
const inMail = (await renderBrief(data as BriefProps)).html;
const inMailBox = data.items[0].image;
assert(inMailBox, "The Brief fixture should supply an image");

describe.each([
  { where: "alone", html: alone, box: { width: 280, height: 152 } },
  { where: "in the Brief", html: inMail, box: inMailBox },
])("Image keeps its box while images are blocked $where", ({ html, box }) => {
  test("whole-pixel width and height in attribute and style, never auto", () => {
    expect(attr(html, "img", "width")).toBe(String(box.width));
    expect(attr(html, "img", "height")).toBe(String(box.height));
    const img = style(html, "img");
    expect(img.width).toBe(`${attr(html, "img", "width")}px`);
    expect(img.height).toBe(`${attr(html, "img", "height")}px`);
    expect(html).not.toMatch(/height:\s*auto|height="auto"/);
  });

  test("the tint behind the image and its cell", () => {
    expect(style(html, "img")["background-color"]).toBe(tint);
    expect(cell(html)).toContain(`bgcolor="${tint}"`);
    expect(cell(html)).toContain(`background-color:${tint}`);
    expect(cell(html)).toMatch(/width:\d+px;height:\d+px/);
  });

  test("alt text in Arial 12/16, muted, without the link's underline", () => {
    const imageStyle = style(html, "img");
    expect(imageStyle["font-family"]).toMatch(/^Arial/);
    expect(imageStyle).toMatchObject({
      "font-size": "12px",
      "line-height": "16px",
      color: muted,
      "text-decoration": "none",
    });
    const link = html.match(/<a\b[^>]*>(?=<img)/)?.[0];
    assert(link, "The image should be wrapped in a link");
    expect(style(link, "a")).toMatchObject({ "text-decoration": "none", color: muted });
  });

  test("image and cell in the small corner", () => {
    expect(style(html, "img")["border-radius"]).toBe(corner);
    expect(cell(html)).toContain(`border-radius:${corner}`);
  });
});

test("refuses a size that is no whole pixel, too wide for a phone, or an image without alt", () => {
  expect(() => renderToStaticMarkup(<Image {...props} width={300.5} />)).toThrow("whole number");
  expect(() => renderToStaticMarkup(<Image {...props} height={0} />)).toThrow("whole number");
  expect(() => renderToStaticMarkup(<Image {...props} width={MAX_IMAGE_WIDTH + 1} />)).toThrow(
    "phone column",
  );
  expect(() => renderToStaticMarkup(<Image {...props} alt=" " />)).toThrow("no alt text");
});
