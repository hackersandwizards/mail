import { fc, test, unicodeString } from "@hackersandwizards/scaffolding/property";
import { expect } from "vitest";
import { palette, unreachedColours } from "../components/theme";

const hex = fc
  .integer({ min: 0, max: 0xffffff })
  .map((value) => value.toString(16).padStart(6, "0"));
const properties = [
  "color",
  "background-color",
  "fill",
  "stroke",
  "border-bottom-color",
  "outline",
] as const;
const quotes = ['"', "'", ""] as const;

test.prop([hex, fc.constantFrom(...properties), fc.constantFrom(...quotes)], {
  examples: [
    ["000000", "color", ""],
    ["ffffff", "background-color", "'"],
    ["123456", "fill", '"'],
    ["000000", "stroke", '"'],
    ["123456", "border-bottom-color", '"'],
    ["123456", "outline", '"'],
  ],
})("inline paint outside the six-digit dark overrides is reported", (rgb, property, quote) => {
  const declaration = `${property}:${quote ? " " : ""}#${rgb}ff`;
  expect(unreachedColours(`<td style=${quote}${declaration}${quote}>`)).toEqual([declaration]);
});

test.prop(
  [fc.constantFrom(...Object.values(palette.light)), fc.constantFrom(" ", "", "  ", "\t")],
  {
    examples: [
      ["#ffffff", " "],
      ["#ffffff", ""],
      ["#ffffff", "  "],
    ],
  },
)(
  "dark overrides match the exact inline role spelling and never apply to stylesheet rules",
  (color, space) => {
    const declaration = `color:${space}${color}`;
    expect(unreachedColours(`<td style="padding: 4px; ${declaration}; border: 0">`)).toEqual(
      space === " " ? [] : [declaration],
    );
    expect(
      unreachedColours(`<style type='text/css'>#face td{padding: 4px; ${declaration}}</style >`),
    ).toEqual([declaration]);
  },
);

test.prop(
  [
    fc.array(fc.constantFrom("bgcolor", "color", "fill", "stroke"), { maxLength: 8 }),
    unicodeString,
  ],
  {
    examples: [
      [["color"], ""],
      [["bgcolor", "fill", "stroke"], "語".repeat(1024)],
      [[], "a?color=red&bgcolor=red"],
    ],
  },
)("colour-like strings in another attribute or in text do not paint", (names, text) => {
  const words = text
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  const colourWords = names.map((name) => ` ${name}=red`).join("");
  expect(
    unreachedColours(`<span title="${words}${colourWords}">${words}${colourWords}</span>`),
  ).toEqual([]);
});

test.prop(
  [fc.constantFrom("bgcolor", "color", "fill", "stroke"), hex, fc.constantFrom(" ", "\t", "\n")],
  {
    examples: [
      ["stroke", "123456", "\t"],
      ["color", "abcdef", "\n"],
      ["bgcolor", "abcdef", " "],
      ["fill", "123456", " "],
    ],
  },
)(
  "real colour attributes are reported even beside a non-paint attribute",
  (name, rgb, whitespace) => {
    const attribute = `${name.toUpperCase()}${whitespace}=${whitespace}#${rgb}`;
    expect(unreachedColours(`<svg:rect hidden title='color=red >' ${attribute}>`)).toEqual([
      attribute,
    ]);
  },
);

test.prop(
  [
    fc.constantFrom("none", "transparent"),
    fc.constantFrom("", " ", "  ", "\t"),
    fc.constantFrom("background", "background-image"),
  ],
  {
    examples: [
      ["none", "", "background"],
      ["transparent", "  ", "background-image"],
      ["none", " ", "background-image"],
    ],
  },
)(
  "non-paint background keywords are ignored and a named paint background is reported",
  (keyword, space, name) => {
    const background = `${name}${space}:${space}white`;
    expect(unreachedColours(`<td style="${name}${space}:${space}${keyword}">`)).toEqual([]);
    expect(unreachedColours(`<td style="${background}">`)).toEqual([background]);
    const layer = keyword === "none" ? "white" : "url(picture.png)";
    const painted = `background:${space}${keyword} ${layer}`;
    expect(unreachedColours(`<p style="${painted}">`)).toEqual([painted]);
  },
);
