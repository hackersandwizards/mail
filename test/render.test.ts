import { assert, describe, expect, test } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { colors, tokens } from "@hackersandwizards/brand/tokens";
import { defined } from "@hackersandwizards/scaffolding/defined";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { BriefProps } from "../mails/Brief";
import { mailtoHref } from "../components/ObjectionNotice";
import { unreachedColours } from "../components/theme";
import { renderBrief } from "../scripts/render";
import data from "../catalog/mails/brief.json";
import { style } from "./markup";

const brief = data as BriefProps;
const root = fileURLToPath(new URL("..", import.meta.url));
const mail = await renderBrief(brief);
const escaped = (text: string) => renderToStaticMarkup(createElement(Fragment, null, text));
describe("renderBrief", () => {
  const { html, text } = mail;

  test("the HTML document declares its language, viewport, color scheme and title", () => {
    expect(html).toContain('<html dir="ltr" lang="de">');
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1"/>');
    expect(html).toContain('<meta name="color-scheme" content="light dark"/>');
    expect(html).toContain(`<title>${escaped(brief.subject)}</title>`);
    expect(html.match(/<title>/g)).toHaveLength(1);
  });

  test("dark declarations stay in the mail for clients that read them", () => {
    expect(html).toContain("@media (prefers-color-scheme: dark)");
    expect(html).toContain("[data-ogsc] .hw-ink");
    expect(html).not.toMatch(/<link[^>]+stylesheet/);
  });

  test("the HTML part fits below Gmail’s clipping threshold", () => {
    expect(Buffer.byteLength(html)).toBeLessThan(102_000);
  });

  test.each(brief.items)("the HTML part links to $href", ({ href }) => {
    expect(html).toContain(`href="${escaped(href)}"`);
  });

  test("the signature carries the only wordmark after the greeting", () => {
    expect(html.match(/>hackers<\/span>/g)).toHaveLength(1);
    expect(html.indexOf(escaped(brief.greeting))).toBeLessThan(html.indexOf(">hackers</span>"));
    expect(html).toContain(escaped(brief.signature.name));
    expect(html).toContain(`color:${colors["--color-teal"]}`);
  });

  test("the objection link carries the supplied mailto query", () => {
    expect(html).toContain(
      'href="mailto:kim.beispiel@example.com?subject=Bitte%20keine%20Updates%20mehr&amp;body=',
    );
  });

  test("both parts hold every word the data gives the engine's own parts", () => {
    const words = [
      brief.greeting,
      ...brief.intro,
      ...brief.items.flatMap((item) => [
        item.title,
        item.text,
        defined(item.destination, "catalog item destination"),
      ]),
      ...brief.outro,
      ...brief.closing,
      brief.objection.before,
      brief.objection.linkText,
      brief.objection.after,
    ];
    for (const said of words) {
      expect(html).toContain(escaped(said));
      expect(text).toContain(said);
    }
    for (const item of brief.items) expect(html).toContain(`>${escaped(item.label)}</p>`);
    expect(text).toContain(`${brief.signature.role}, `);
  });

  test("item titles are underlined links, each says where it leads, labels take brand's label type", () => {
    for (const item of brief.items) {
      const link = html.match(
        new RegExp(`<a href="${RegExp.escape(escaped(item.href))}"[^>]*>`),
      )?.[0];
      expect(link).toContain("text-decoration-line:underline");
      expect(link).not.toContain("text-decoration-line:none");
    }
    for (const item of brief.items) {
      const destination = defined(item.destination, "catalog item destination");
      expect(html).toMatch(
        new RegExp(
          `${RegExp.escape(escaped(item.title))}</a></p><p class="hw-muted"[^>]*>${RegExp.escape(escaped(destination))}</p>`,
        ),
      );
    }
    const labels = html.match(/<p class="hw-label"[^>]*>/g);
    assert(labels, "The HTML should include item labels");
    expect(labels).toHaveLength(brief.items.length);
    const size = parseFloat(tokens["--text-label"]) * 16;
    for (const label of labels) {
      expect(style(label, "p")).toMatchObject({
        "font-size": `${size}px`,
        "line-height": `${+(size * Number(tokens["--text-label--line-height"])).toFixed(2)}px`,
        "font-weight": `${tokens["--type-label-weight"]}`,
        "letter-spacing": `${tokens["--tracking-label"]}`,
        "text-transform": `${tokens["--type-label-case"]}`,
      });
    }
  });

  test.each([
    ["a respelled attribute colour", '<td bgcolor="#eef1f4">', ['bgcolor="#eef1f4']],
    [
      "a named background, a functional border colour and a colour attribute",
      '<td style="background: white; border: 1px solid rgb(1, 2, 3)"><font color="navy">',
      ["background: white", "border: 1px solid rgb(1, 2, 3)", 'color="navy'],
    ],
    [
      "colour literals in arbitrary CSS properties and SVG paint",
      '<td style="outline: 1px solid #123456; box-shadow: 0 0 0 1px oklch(0.5 0.1 200)"><path fill="#123456">',
      ["outline: 1px solid #123456", "box-shadow: 0 0 0 1px oklch(0.5 0.1 200)", 'fill="#123456'],
    ],
    ["attribute-looking text", '<span title=" bgcolor=red"> bgcolor=red</span>', []],
    [
      "paint in a style element",
      "<style>td{background:#ffffff;color:#1a7285}</style>",
      ["background:#ffffff", "color:#1a7285"],
    ],
    ["a declaration after a comment", '<td style="/* x */ color: red">', ["color: red"]],
    [
      "named colours in a fill, a stroke and a colour longhand",
      '<rect style="fill: red; stroke: navy; border-bottom-color: silver">',
      ["fill: red", "stroke: navy", "border-bottom-color: silver"],
    ],
  ])("signature paint outside the roles: %s", (_, html, unsupported) => {
    expect(unreachedColours(html)).toEqual(unsupported);
  });

  test("comments and custom properties are ignored when scanning signature paint", () => {
    expect(
      unreachedColours(
        '<!-- <td style="color:red" bgcolor=red> -->' +
          '<td style="--note: color: unused; --hint: background: unused; outline: 1px solid hsl(0, 0%, 0%)">',
      ),
    ).toEqual(["outline: 1px solid hsl(0, 0%, 0%)"]);
  });

  test("signature paint inside Outlook conditional markup is reported", () => {
    expect(unreachedColours('<!--[if mso]><td style="color:red"><![endif]-->')).toEqual([
      "color:red",
    ]);
  });

  test("a signature stylesheet reports painted declarations alongside ordinary layout", () => {
    const signature = `<style type="text/css">
      .name { color : navy; padding: 4px; outline: 1px solid rgba(0, 0, 0, .5); }
    </style>`;
    expect(unreachedColours(signature)).toEqual([
      "color : navy",
      "outline: 1px solid rgba(0, 0, 0, .5)",
    ]);
  });

  test("the text part keeps the notice outside signature markup", () => {
    expect(text).not.toMatch(/^-- $/m);
    expect(text).not.toContain("mailto:");
    expect(text).not.toContain("<");
  });
});

describe("mail-render", () => {
  test("writes the HTML and the text part from a data file", async () => {
    const cache = join(root, "node_modules", ".cache", "mail-test");
    mkdirSync(cache, { recursive: true });
    const dir = mkdtempSync(join(cache, "render-"));
    try {
      const out = join(dir, "brief");
      const run = spawnSync(
        "bun",
        ["scripts/render.ts", "catalog/mails/brief.json", "--out", out],
        {
          cwd: root,
          encoding: "utf-8",
        },
      );
      expect(run.status).toBe(0);
      expect(readFileSync(`${out}.html`, "utf-8")).toBe(mail.html);
      expect(readFileSync(`${out}.txt`, "utf-8")).toBe(mail.text);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  test("refuses a call without a data file", () => {
    const run = spawnSync("bun", ["scripts/render.ts"], { cwd: root, encoding: "utf-8" });
    expect(run.status).toBe(1);
    expect(run.stderr).toContain("usage");
  });
});

test("a Unicode line separator in an objection body opens as CRLF", () => {
  expect(mailtoHref({ to: "kim@example.com", body: "Hallo,\u2028bitte nicht mehr." })).toBe(
    "mailto:kim@example.com?body=Hallo%2C%0D%0Abitte%20nicht%20mehr.",
  );
});

const breakCases = [
  {
    field: "greeting",
    set: (m: BriefProps, v: string) => (m.greeting = v),
    input: "Zeile 0\nweiter 0",
    html: "Zeile 0<br/>weiter 0",
    text: "Zeile 0\nweiter 0",
  },
  {
    field: "intro",
    set: (m: BriefProps, v: string) => (m.intro[0] = v),
    input: "Zeile 1\r\nweiter 1",
    html: "Zeile 1<br/>weiter 1",
    text: "Zeile 1\nweiter 1",
  },
  {
    field: "outro",
    set: (m: BriefProps, v: string) => (m.outro[0] = v),
    input: "Zeile 2\rweiter 2",
    html: "Zeile 2<br/>weiter 2",
    text: "Zeile 2\nweiter 2",
  },
  {
    field: "closing",
    set: (m: BriefProps, v: string) => (m.closing[0] = v),
    input: "Zeile 3\u2028weiter 3",
    html: "Zeile 3<br/>weiter 3",
    text: "Zeile 3\nweiter 3",
  },
  {
    field: "label",
    set: (m: BriefProps, v: string) => (m.items[0].label = v),
    input: "Zeile 4\u2029weiter 4",
    html: "Zeile 4<br/>weiter 4",
    text: "ZEILE 4\nWEITER 4",
  },
  {
    field: "title",
    set: (m: BriefProps, v: string) => (m.items[0].title = v),
    input: "Zeile 5\u0085weiter 5",
    html: "Zeile 5<br/>weiter 5",
    text: "Zeile 5\nweiter 5",
  },
  {
    field: "destination",
    set: (m: BriefProps, v: string) => (m.items[0].destination = v),
    input: "Zeile 6\vweiter 6",
    html: "Zeile 6<br/>weiter 6",
    text: "Zeile 6\nweiter 6",
  },
  {
    field: "text",
    set: (m: BriefProps, v: string) => (m.items[0].text = v),
    input: "Zeile 7\fweiter 7",
    html: "Zeile 7<br/>weiter 7",
    text: "Zeile 7\nweiter 7",
  },
  {
    field: "objection.before",
    set: (m: BriefProps, v: string) => (m.objection.before = v),
    input: "Zeile 8\nweiter 8",
    html: "Zeile 8<br/>weiter 8",
    text: "Zeile 8\nweiter 8",
  },
  {
    field: "objection.linkText",
    set: (m: BriefProps, v: string) => (m.objection.linkText = v),
    input: "Zeile 9\r\nweiter 9",
    html: "Zeile 9<br/>weiter 9",
    text: "Zeile 9\nweiter 9",
  },
  {
    field: "objection.after",
    set: (m: BriefProps, v: string) => (m.objection.after = v),
    input: "Zeile 10\rweiter 10",
    html: "Zeile 10<br/>weiter 10",
    text: "Zeile 10\nweiter 10",
  },
];
const withBreaks = structuredClone(brief);
for (const { set, input } of breakCases) set(withBreaks, input);
const brokenMail = await renderBrief(withBreaks);

test.each(breakCases)("a line break in $field reads the same in both parts", ({ html, text }) => {
  expect(brokenMail.html).toContain(html);
  expect(brokenMail.text).toContain(text);
});

test("the HTML preserves an unbroken item description", () => {
  expect(brokenMail.html).toContain(`>${escaped(brief.items[1].text)}</p>`);
});

test("the text part holds only LF line breaks", () => {
  expect(brokenMail.text).not.toMatch(/[\v\f\r\u0085\u2028\u2029]/);
});
