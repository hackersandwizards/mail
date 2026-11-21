import { fc, test, unicodeString } from "@hackersandwizards/scaffolding/property";
import { expect } from "vitest";
import { itemText } from "../components/Item";
import { mailtoHref, objectionText } from "../components/ObjectionNotice";
import { signatureText } from "../components/Signature";
import { label as labelType } from "../components/theme";
import { briefText } from "../mails/Brief";
import data from "../catalog/mails/brief.json";
import type { BriefProps } from "../mails/Brief";

const brief: BriefProps = { ...data, lang: "de" };
const line = unicodeString.map((text) => text.replace(/[\n\r\v\f\u0085\u2028\u2029]/g, ""));
const separators = ["\r\n", "\n", "\r", "\v", "\f", "\u0085", "\u2028", "\u2029"] as const;

test.prop(
  [
    fc.array(line, { maxLength: 8 }),
    fc.constantFrom(...separators),
    fc.option(line, { nil: undefined }),
  ],
  {
    examples: [
      [[], "\n", undefined],
      [[""], "\n", ""],
      [["縦".repeat(1024)], "\n", undefined],
      ...separators.map(
        (separator) =>
          [["Hallo,", "bitte & ?#%=+ nicht mehr."], separator, "Grüße 好"] satisfies [
            string[],
            string,
            string,
          ],
      ),
    ],
  },
)(
  "mailto round-trips its fields and writes body separators as CRLF",
  (lines, separator, subject) => {
    const body = lines.join(separator);
    const to = "kim@example.com";
    const href = mailtoHref({ to, subject, body });
    const url = new URL(href);
    expect(url.protocol).toBe("mailto:");
    expect(url.pathname).toBe(to);
    expect(
      url.search
        .slice(1)
        .split("&")
        .filter(Boolean)
        .map((field) => field.split("=").map(decodeURIComponent)),
    ).toEqual([
      ...(subject ? [["subject", subject]] : []),
      ...(body ? [["body", lines.join("\r\n")]] : []),
    ]);
    if (!subject && !body) expect(href).toBe(`mailto:${to}`);
  },
);

test.prop([line, line, line, fc.option(line, { nil: undefined })], {
  examples: [
    ["Straße", "標題", "é".repeat(1024), undefined],
    ["", "", "", ""],
    ["a/b", "?&", "x", "Ziel"],
  ],
})(
  "an item writes its heading, URL, optional destination and text in order",
  (label, title, text, destination) => {
    const href = "https://example.com/article";
    const display = {
      uppercase: label.toUpperCase(),
      lowercase: label.toLowerCase(),
      none: label,
    }[labelType.textTransform];
    const expected = [`${display}: ${title}`, href];
    if (destination) expected.push(destination);
    if (text) expected.push(text);
    expect(itemText({ label, title, text, destination, href })).toBe(expected.join("\n"));
  },
);

test.prop([line, line, line, line], {
  examples: [
    ["Mit ", "dieser Mail", " abmelden.", "a?b&c=#d"],
    ["", "", "", ""],
    ["語".repeat(1024), "🚀", "(?)", "plus+space"],
  ],
})(
  "the notice writes its words and address without the mailto query",
  (before, linkText, after, body) => {
    const to = "kim@example.com";
    expect(objectionText({ before, linkText, after, mailto: { to, body, subject: body } })).toBe(
      `${before}${linkText} (${to})${after}`,
    );
  },
);

test.prop(
  [
    fc.array(line, { maxLength: 8 }),
    fc.array(line, { maxLength: 8 }),
    fc.array(line, { minLength: 1, maxLength: 8 }),
    fc.constantFrom(...separators),
  ],
  {
    examples: separators.map(
      (separator) =>
        [["Einführung", "前"], ["語".repeat(1024)], ["Gruß", "Kim"], separator] satisfies [
          string[],
          string[],
          string[],
          string,
        ],
    ),
  },
)(
  "Brief text preserves block order and normalizes breaks to LF",
  (intro, outro, closing, separator) => {
    const greeting = `Moin${separator}Robin,`;
    const expected = [
      "Moin\nRobin,",
      ...intro,
      ...brief.items.map(itemText),
      ...outro,
      closing.join("\n"),
      signatureText(brief.signature).trim(),
      objectionText(brief.objection),
    ];
    expect(briefText({ ...brief, greeting, intro, outro, closing })).toBe(
      `${expected.join("\n\n")}\n`,
    );
  },
);
