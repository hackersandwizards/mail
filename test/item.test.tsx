import { assert, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { colors } from "@hackersandwizards/brand/tokens";
import { Item } from "../components/Item";
import { attr, style } from "./markup";

const item = {
  label: "Artikel",
  title: "Mail lesen",
  href: "https://example.com/article",
  text: "Eine Anleitung für die Mail.",
};
const picture = { src: "preview.png", alt: "Vorschau", width: 80, height: 40 };

test.each([
  { href: undefined, link: item.href },
  { href: "https://example.com/gallery", link: "https://example.com/gallery" },
])("the image links to $link", ({ href, link }) => {
  const html = renderToStaticMarkup(<Item {...item} image={{ ...picture, href }} />);
  expect(html.match(/<a[^>]*>(?=<img)/)?.[0]).toContain(`href="${link}"`);
});

const destination = "Auf der Website, 6 Min.";
const withDestination = renderToStaticMarkup(<Item {...item} destination={destination} />);
const plainItem = renderToStaticMarkup(<Item {...item} />);
const titleParagraph = /<p[^>]*>(?=<a[^>]*>Mail lesen)/;

test.each([
  { name: "with a destination", html: withDestination, margin: "0 0 2px" },
  { name: "without a destination", html: plainItem, margin: "0 0 8px" },
])("the title spacing $name", ({ html, margin }) => {
  const title = html.match(titleParagraph)?.[0];
  assert(title, "The item title should wrap the link");
  expect(style(title, "p")).toMatchObject({ margin });
});

test("the title uses bold type with a 26px line height", () => {
  const title = withDestination.match(titleParagraph)?.[0];
  assert(title, "The item title should wrap the link");
  expect(style(title, "p")).toMatchObject({ "font-weight": "bold", "line-height": "26px" });
});

test.each([
  {
    name: "present as a muted paragraph",
    html: withDestination,
    selector: /<p[^>]*>(?=Auf der Website, 6 Min\.)/,
    expected: [
      {
        className: "hw-muted",
        style: {
          color: colors["--color-muted"],
          "line-height": "20px",
          margin: "0 0 8px",
        },
      },
    ],
  },
  {
    name: "absent when omitted",
    html: plainItem,
    selector: /class="hw-muted"/,
    expected: undefined,
  },
])("the destination is $name", ({ html, selector, expected }) => {
  const observed = html.match(selector)?.map((tag) => {
    const { color, "line-height": lineHeight, margin } = style(tag, "p");
    return {
      className: attr(tag, "p", "class"),
      style: { color, "line-height": lineHeight, margin },
    };
  });
  expect(observed).toEqual(expected);
});

test("the item's layout spaces the accent rule away from the next item and from its text", () => {
  expect(style(plainItem, "table")).toMatchObject({ "margin-bottom": "32px" });
  expect({
    className: attr(plainItem, "td", "class"),
    style: style(plainItem, "td"),
  }).toMatchObject({
    className: "hw-border-accent",
    style: { "border-left": `3px solid ${colors["--color-teal"]}`, "padding-left": "14px" },
  });
});

test("the label has its own type and spacing", () => {
  const label = plainItem.match(/<p[^>]*>(?=Artikel)/)?.[0];
  assert(label, "The item should have a label");
  expect({ className: attr(label, "p", "class"), style: style(label, "p") }).toMatchObject({
    className: "hw-label",
    style: { margin: "0 0 6px" },
  });
});

test("the description uses body type", () => {
  const description = plainItem.match(/<p[^>]*>(?=Eine Anleitung)/)?.[0];
  assert(description, "The item should have a description");
  expect(style(description, "p")).toMatchObject({ "font-size": "16px", "line-height": "24px" });
});
