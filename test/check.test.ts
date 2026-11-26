// A data file that would render a wrong mail is refused, naming the field, before anything renders.
import { describe, expect, test } from "vitest";
import { defined } from "@hackersandwizards/scaffolding/defined";
import { rejection } from "@hackersandwizards/scaffolding/rejection";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_IMAGE_WIDTH } from "../components/Image";
import { checkBrief, type BriefProps } from "../mails/Brief";
import { parseBrief, renderBrief } from "../scripts/render";
import data from "../catalog/mails/brief-bild.json";

const root = fileURLToPath(new URL("..", import.meta.url));
const copy = (): Record<string, unknown> => structuredClone(data);

/** The data with the value at the path removed or replaced. */
function edit(path: string, value?: unknown) {
  const out = copy();
  const keys = path.split(/\.|\[|\]/).filter(Boolean);
  const last = defined(keys.pop(), "last key in the fixture edit path");
  const parent = keys.reduce<Record<string, unknown>>(
    (node, key) => node[key] as Record<string, unknown>,
    out,
  );
  if (value === undefined) delete parent[last];
  else parent[last] = value;
  return out as BriefProps;
}

const REQUIRED = [
  "lang",
  "subject",
  "preview",
  "greeting",
  "intro",
  "items",
  "outro",
  "closing",
  "signature",
  "signature.name",
  "signature.role",
  "objection",
  "objection.before",
  "objection.linkText",
  "objection.after",
  "objection.mailto",
  "objection.mailto.to",
  "items[0].label",
  "items[0].title",
  "items[0].href",
  "items[0].text",
  "items[0].image.src",
  "items[0].image.alt",
];

describe("renderBrief refuses data that would render a wrong mail", () => {
  test("a hole in a Brief's intro is rejected at the missing line", () => {
    const intro: string[] = [];
    intro.length = 1;
    expect(() => checkBrief({ ...data, intro })).toThrow("intro[0] must be a non-empty string");
  });

  test("Brief validation checks the indexed items used by the renderers", () => {
    const items = [{ ...data.items[0], title: "" }];
    items[Symbol.iterator] = data.items.values.bind(data.items);
    expect(() => checkBrief({ ...data, items })).toThrow(
      "items[0].title must be a non-empty string",
    );
  });

  test("Brief validation checks the iterated intro used by the plain-text renderer", () => {
    const intro = ["Valid line"];
    intro[Symbol.iterator] = [""].values.bind([""]);
    expect(() => checkBrief({ ...data, intro })).toThrow("intro[0] must be a non-empty string");
  });

  test("the catalog data passes", async () => {
    expect((await renderBrief(copy() as BriefProps)).text).toContain(data.greeting);
  });

  test("a relative image path may hold a decomposed letter, as a macOS file name does", async () => {
    const src = "bilder/U\u0308bersicht.png";
    expect((await renderBrief(edit("items[0].image.src", src))).html).toContain(`src="${src}"`);
  });

  test.each([[null], [[]], ["mail"]])("a data file containing %j needs a mail object", (value) => {
    expect(() => parseBrief(JSON.stringify(value))).toThrow("the data must be an object");
  });

  test.each([
    ["signature", [], "signature must be an object"],
    ["items[0].image", false, "items[0].image must be an object"],
    [
      "items[1].destinaton",
      "Video",
      "is no field; the fields are label, title, href, text, destination, image",
    ],
    ["subject", 7, "must be a non-empty string, got 7"],
    ["subject", "Update\nSecond line", "subject must be one line"],
    ["lang", "fr", 'must be "de" or "en", got fr'],
    ["closing", [], "must be a list of at least 1 entries"],
    ["preview", "x".repeat(201), "is longer than 200 characters, where the inbox line is cut"],
    ["items[1].href", "http://example.com", 'must be an https URL, got "http://example.com"'],
    [
      "items[0].image.src",
      "http://example.com/a.png",
      "must be an https URL or a plain relative path",
    ],
    ["items[0].image.height", -1, "must be a whole number of pixels above 0, got -1"],
    [
      "items[0].image.width",
      MAX_IMAGE_WIDTH + 1,
      `is wider than the ${MAX_IMAGE_WIDTH} px the phone column holds`,
    ],
    ["objection.mailto.to", "kim@example.com?bcc=x@example.com", "must be one plain address"],
    ["objection.mailto.body", " ", "objection.mailto.body must be a non-empty string"],
  ])("tells the author how to fix %s", async (path, value, message) => {
    expect(await rejection(renderBrief(edit(path, value)))).toContain(message);
  });

  test("one item and one closing line are enough for an English Brief", async () => {
    const props = copy() as BriefProps;
    props.lang = "en";
    props.intro = [];
    props.outro = [];
    props.closing = ["Cheers"];
    delete props.signature.linkedin;
    props.objection.mailto = { to: "kim@example.com" };
    const [item] = props.items;
    delete item.destination;
    item.image = {
      src: "pictures//preview.png",
      alt: "Preview",
      width: MAX_IMAGE_WIDTH,
      height: 1,
    };
    props.items = [item];
    const { html, text } = await renderBrief(props);
    expect(html).toContain('lang="en"');
    expect(html).toContain('src="pictures//preview.png"');
    expect(html).toContain('href="mailto:kim@example.com"');
    expect(text).toContain(`${item.href}\n${item.text}\n\nCheers\n\n${props.signature.name}\n`);
  });

  // The refusal starts with the path: rendering without the check also fails on a missing list, with
  // an engine error that quotes the field somewhere.
  test.each(REQUIRED)("without %s", async (path) => {
    const error = await rejection(renderBrief(edit(path)));
    expect(error.startsWith(`Error: ${path} `), error).toBe(true);
  });

  test.each([
    ["subject", " "],
    ["intro[0]", 7],
    ["closing", []],
    ["items", []],
    ["items[1].destination", " "],
    ["items[0].image.src", "//cdn.example.com/a.png"],
    ["items[0].image.src", " http://example.com/a.png"],
    ["items[0].image.src", "ht\ttp://example.com/a.png"],
    ["items[0].image.src", "\\\\cdn.example.com/a.png"],
    ["items[0].image.src", "\u0001//cdn.example.com/a.png"],
    ["subject", "Update\u2028Bcc: x@example.com"],
    ["signature.role", "Gründerin\u2028CEO"],
    ["items[1].href", "javascript:alert(1)"],
    ["items[1].href", "http://example.com/"],
    ["items[1].href", "https:// x"],
    ["items[1].href", "https://example.com/podcast/folge-12\n"],
    ["items[1].href", "https://exam\u200bple.com/talks"],
    ["items[0].image.src", "http://example.com/a.png"],
    ["items[0].image.src", "data:image/png;base64,AA"],
    ["items[0].image.href", "data:text/html,<p>"],
    ["objection.mailto.to", "kim@example.com?bcc=x@example.com"],
    ["objection.mailto.to", "kim"],
    ["objection.mailto.to", "kim@example.com%2Cx%40example.com"],
    ["objection.mailto.to", "kim@example.com/x"],
    ["signature.linkedin", "http://www.linkedin.com/in/kim-beispiel"],
  ])("%s set to %j", async (path, value) => {
    const error = await rejection(renderBrief(edit(path, value)));
    expect(error.startsWith(`Error: ${path} `), error).toBe(true);
  });

  test("a preview of 200 characters reaches the inbox line uncut", async () => {
    const preview = "x".repeat(200);
    expect((await renderBrief(edit("preview", preview))).html).toContain(`>${preview}<`);
  });

  test.each([
    {
      reason: "a missing objection address",
      name: "missing-to.json",
      json: JSON.stringify(edit("objection.mailto.to")),
      output: (dir: string) => ["--out", join(dir, "out")],
      expected: { status: 1, stdout: "" },
      stderr: { anchor: "", detail: "objection.mailto.to" },
    },
    {
      reason: "malformed JSON",
      name: "malformed.json",
      json: "{",
      output: () => [],
      expected: { status: 1 },
      stderr: { anchor: "^", detail: "" },
    },
  ])("mail-render names $reason and writes nothing", ({ name, json, output, expected, stderr }) => {
    const cache = join(root, "node_modules", ".cache", "mail-test");
    mkdirSync(cache, { recursive: true });
    const dir = mkdtempSync(join(cache, "check-"));
    try {
      const file = join(dir, name);
      writeFileSync(file, json);
      const run = spawnSync("bun", ["scripts/render.ts", file, ...output(dir)], {
        cwd: root,
        encoding: "utf-8",
      });
      expect(run).toMatchObject(expected);
      const diagnostic = RegExp.escape(`mail-render: ${file}: ${stderr.detail}`);
      expect(run.stderr).toMatch(new RegExp(`${stderr.anchor}${diagnostic}`));
      expect(readdirSync(dir)).toEqual([name]);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});
