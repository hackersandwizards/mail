import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { LayoutCell } from "../components/LayoutCell";
import { attr, style } from "./markup";

test("the presentation table and its cell keep their own attributes", () => {
  const html = renderToStaticMarkup(
    <LayoutCell
      width="100%"
      tableStyle={{ marginBottom: 12 }}
      cell={{ className: "sample", width: 100, height: 40, style: { paddingLeft: 8 } }}
    >
      Sample
    </LayoutCell>,
  );

  expect({
    role: attr(html, "table", "role"),
    cellPadding: attr(html, "table", "cellPadding"),
    cellSpacing: attr(html, "table", "cellSpacing"),
    border: attr(html, "table", "border"),
    width: attr(html, "table", "width"),
    style: style(html, "table"),
  }).toEqual({
    role: "presentation",
    cellPadding: "0",
    cellSpacing: "0",
    border: "0",
    width: "100%",
    style: { "margin-bottom": "12px" },
  });
  expect({
    className: attr(html, "td", "class"),
    width: attr(html, "td", "width"),
    height: attr(html, "td", "height"),
    style: style(html, "td"),
  }).toEqual({
    className: "sample",
    width: "100",
    height: "40",
    style: { "padding-left": "8px" },
  });
});
