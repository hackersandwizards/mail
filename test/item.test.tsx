import { expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { colors } from "@hackersandwizards/brand/tokens";
import { Item, itemText } from "../components/Item";

const item = {
  label: "Artikel",
  title: "Mail lesen",
  href: "https://example.com/article",
  text: "Eine Anleitung für die Mail.",
};
const picture = { src: "preview.png", alt: "Vorschau", width: 80, height: 40 };

test("an item without a destination reads as three lines with no gap", () => {
  expect(itemText(item)).toBe(
    "ARTIKEL: Mail lesen\nhttps://example.com/article\nEine Anleitung für die Mail.",
  );
});

test.each([undefined, "https://example.com/gallery"])(
  "the image links to %s when supplied or to the item otherwise",
  (href) => {
    const html = renderToStaticMarkup(<Item {...item} image={{ ...picture, href }} />);
    const link = html.match(/<a[^>]*>(?=<img)/)?.[0];
    expect(link).toContain(`href="${href ?? item.href}"`);
  },
);

test("a destination sits below the link in muted text with its own spacing", () => {
  const destination = "Auf der Website, 6 Min.";
  const html = renderToStaticMarkup(<Item {...item} destination={destination} />);
  const title = html.match(/<p[^>]*>(?=<a[^>]*>Mail lesen)/)?.[0];
  const detail = html.match(/<p[^>]*>(?=Auf der Website, 6 Min\.)/)?.[0];
  expect(title).toContain("font-weight:bold");
  expect(title).toContain("line-height:26px");
  expect(title).toContain("margin:0 0 2px");
  expect(detail).toContain('class="hw-muted"');
  expect(detail).toContain(`color:${colors["--color-muted"]}`);
  expect(detail).toContain("line-height:20px");
  expect(detail).toContain("margin:0 0 8px");
  const without = renderToStaticMarkup(<Item {...item} />);
  expect(without.match(/<p[^>]*>(?=<a[^>]*>Mail lesen)/)?.[0]).toContain("margin:0 0 8px");
  expect(without).not.toContain('class="hw-muted"');
});

test("the item's accent rule and label stay styled in a client that needs inline CSS", () => {
  const html = renderToStaticMarkup(<Item {...item} />);
  expect(html.match(/<table[^>]*>/)?.[0]).toContain("margin-bottom:32px");
  const cell = html.match(/<td[^>]*>/)?.[0];
  expect(cell).toContain('class="hw-border-accent"');
  expect(cell).toContain(`border-left:3px solid ${colors["--color-teal"]}`);
  expect(cell).toContain("padding-left:14px");
  const label = html.match(/<p[^>]*>(?=Artikel)/)?.[0];
  expect(label).toContain('class="hw-label"');
  expect(label).toContain("margin:0 0 6px");
  const description = html.match(/<p[^>]*>(?=Eine Anleitung)/)?.[0];
  expect(description).toContain("font-size:16px");
  expect(description).toContain("line-height:24px");
});
