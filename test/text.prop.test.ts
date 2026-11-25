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

const href = "https://example.com/article";
const populatedLine = line.filter((text) => text.length > 0);
const destinationLine = fc.oneof(
  fc.constant({ destination: undefined, printed: [] }),
  fc.constant({ destination: "", printed: [] }),
  populatedLine.map((destination) => ({ destination, printed: [destination] })),
);
const descriptionLine = fc.oneof(
  fc.constant({ text: "", printed: [] }),
  populatedLine.map((text) => ({ text, printed: [text] })),
);
const itemWithText = fc
  .tuple(line, line, destinationLine, descriptionLine)
  .map(([label, title, destination, description]) => {
    const display = {
      uppercase: label.toUpperCase(),
      lowercase: label.toLowerCase(),
      none: label,
    }[labelType.textTransform];
    return {
      item: { label, title, href, destination: destination.destination, text: description.text },
      lines: [`${display}: ${title}`, href, ...destination.printed, ...description.printed],
    };
  });

test.prop([itemWithText], {
  examples: [
    [
      {
        item: {
          label: "Straße",
          title: "標題",
          href,
          destination: undefined,
          text: "é".repeat(1024),
        },
        lines: ["STRASSE: 標題", href, "é".repeat(1024)],
      },
    ],
    [
      {
        item: { label: "", title: "", href, destination: "", text: "" },
        lines: [": ", href],
      },
    ],
    [
      {
        item: { label: "a/b", title: "?&", href, destination: "Ziel", text: "x" },
        lines: ["A/B: ?&", href, "Ziel", "x"],
      },
    ],
  ],
})("an item writes its heading, URL, optional destination and text in order", ({ item, lines }) => {
  expect(itemText(item)).toBe(lines.join("\n"));
});

const to = "kim@example.com";
const noticeWithText = fc.tuple(line, line, line, line).map(([before, linkText, after, body]) => ({
  notice: { before, linkText, after, mailto: { to, body, subject: body } },
  text: `${before}${linkText} (${to})${after}`,
}));

test.prop([noticeWithText], {
  examples: [
    [
      {
        notice: {
          before: "Mit ",
          linkText: "dieser Mail",
          after: " abmelden.",
          mailto: { to, body: "a?b&c=#d", subject: "a?b&c=#d" },
        },
        text: "Mit dieser Mail (kim@example.com) abmelden.",
      },
    ],
    [
      {
        notice: { before: "", linkText: "", after: "", mailto: { to, body: "", subject: "" } },
        text: " (kim@example.com)",
      },
    ],
    [
      {
        notice: {
          before: "語".repeat(1024),
          linkText: "🚀",
          after: "(?)",
          mailto: { to, body: "plus+space", subject: "plus+space" },
        },
        text: `${"語".repeat(1024)}🚀 (kim@example.com)(?)`,
      },
    ],
  ],
})("the notice writes its words and address without the mailto query", ({ notice, text }) => {
  expect(objectionText(notice)).toBe(text);
});

const itemBlocks = brief.items.map(itemText);
const signatureBlock = signatureText(brief.signature).trim();
const objectionBlock = objectionText(brief.objection);
const briefWithText = fc
  .tuple(
    fc.array(line, { maxLength: 8 }),
    fc.array(line, { maxLength: 8 }),
    fc.array(line, { minLength: 1, maxLength: 8 }),
    fc.constantFrom(...separators),
  )
  .map(([intro, outro, closing, separator]) => ({
    input: { ...brief, greeting: `Moin${separator}Robin,`, intro, outro, closing },
    blocks: [
      "Moin\nRobin,",
      ...intro,
      ...itemBlocks,
      ...outro,
      closing.join("\n"),
      signatureBlock,
      objectionBlock,
    ],
  }));

const exampleBrief = {
  ...brief,
  intro: ["Einführung", "前"],
  outro: ["語".repeat(1024)],
  closing: ["Gruß", "Kim"],
};
const exampleBlocks = [
  "Moin\nRobin,",
  "Einführung",
  "前",
  ...itemBlocks,
  "語".repeat(1024),
  "Gruß\nKim",
  signatureBlock,
  objectionBlock,
];

test.prop([briefWithText], {
  examples: [
    [{ input: { ...exampleBrief, greeting: "Moin\r\nRobin," }, blocks: exampleBlocks }],
    [{ input: { ...exampleBrief, greeting: "Moin\nRobin," }, blocks: exampleBlocks }],
    [{ input: { ...exampleBrief, greeting: "Moin\rRobin," }, blocks: exampleBlocks }],
    [{ input: { ...exampleBrief, greeting: "Moin\vRobin," }, blocks: exampleBlocks }],
    [{ input: { ...exampleBrief, greeting: "Moin\fRobin," }, blocks: exampleBlocks }],
    [{ input: { ...exampleBrief, greeting: "Moin\u0085Robin," }, blocks: exampleBlocks }],
    [{ input: { ...exampleBrief, greeting: "Moin\u2028Robin," }, blocks: exampleBlocks }],
    [{ input: { ...exampleBrief, greeting: "Moin\u2029Robin," }, blocks: exampleBlocks }],
  ],
})("Brief text preserves block order and normalizes breaks to LF", ({ input, blocks }) => {
  expect(briefText(input)).toBe(`${blocks.join("\n\n")}\n`);
});
