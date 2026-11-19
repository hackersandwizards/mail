// A data file that would render a wrong mail is refused, naming the field, before anything renders.
import { describe, expect, test } from "vitest";
import { rejection } from "@hackersandwizards/scaffolding/rejection";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_IMAGE_WIDTH } from "../components/Image";
import type { BriefProps } from "../mails/Brief";
import { parseBrief, renderBrief } from "../scripts/render";
import data from "../catalog/mails/brief-bild.json";

const root = fileURLToPath(new URL("..", import.meta.url));
const copy = (): Record<string, unknown> => structuredClone(data);

/** The data with the value at the path removed or replaced. */
function edit(path: string, value?: unknown) {
  const out = copy();
  const keys = path.split(/\.|\[|\]/).filter(Boolean);
  const last = keys.pop()!;
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
    ["lang", "fr"],
    ["subject", " "],
    ["intro[0]", 7],
    ["closing", []],
    ["items", []],
    ["preview", "x".repeat(201)],
    ["items[1].destination", " "],
    ["items[1].destinaton", "Video, 32 Min."],
    ["signature.phnoe", "+49 40 1234 5678"],
    ["items[0].image.width", "152"],
    ["items[0].image.height", 0],
    ["items[0].image.width", MAX_IMAGE_WIDTH + 1],
    ["items[0].image.src", "//cdn.example.com/a.png"],
    ["items[0].image.src", " http://example.com/a.png"],
    ["items[0].image.src", "ht\ttp://example.com/a.png"],
    ["items[0].image.src", "\\\\cdn.example.com/a.png"],
    ["items[0].image.src", "\u0001//cdn.example.com/a.png"],
    ["subject", "Update\nBcc: x@example.com"],
    ["subject", "Update\u2028Bcc: x@example.com"],
    ["subject", "Update\u2029Bcc: x@example.com"],
    ["subject", "Update\u0085Bcc: x@example.com"],
    ["subject", "Update\vBcc: x@example.com"],
    ["subject", "Update\fBcc: x@example.com"],
    ["objection.mailto.subject", "Abmelden\nBcc: x@example.com"],
    ["items[1].href", "javascript:alert(1)"],
    ["items[1].href", "http://example.com/"],
    ["items[1].href", "https:// x"],
    ["items[1].href", "https://example.com/podcast/folge-12\n"],
    ["items[1].href", "https://exam\tple.com/talks"],
    ["items[1].href", "https://example.com/\u0001talks"],
    ["items[1].href", "https://exam​ple.com/talks"],
    ["items[1].href", "https://ｅxample.com/talks"],
    ["items[0].image.src", "http://example.com/a.png"],
    ["items[0].image.src", "data:image/png;base64,AA"],
    ["items[0].image.href", "data:text/html,<p>"],
    ["objection.mailto.to", "kim@example.com?bcc=x@example.com"],
    ["objection.mailto.to", "kim"],
    ["objection.mailto.to", "kim@example.com%2Cx%40example.com"],
    ["objection.mailto.to", "kim@example.com\u0001"],
    ["objection.mailto.to", "kim@exam\uff50le.com"],
    ["objection.mailto.to", "kim;x@example.com"],
    ["objection.mailto.to", "kim<x@example.com"],
    ["objection.mailto.to", "kim>x@example.com"],
    ["objection.mailto.to", 'kim"x@example.com'],
    ["objection.mailto.to", "kim@example.com/x"],
    ["signature.linkedin", "http://www.linkedin.com/in/kim-beispiel"],
    ["signature.name", "Kim\nBeispiel"],
    ["signature.role", "Gründerin\u2028CEO"],
    ["signature.phone", "+49 40\r1234 5678"],
  ])("%s set to %j", async (path, value) => {
    const error = await rejection(renderBrief(edit(path, value)));
    expect(error.startsWith(`Error: ${path} `), error).toBe(true);
  });

  test("a preview of 200 characters reaches the inbox line uncut", async () => {
    const preview = "x".repeat(200);
    expect((await renderBrief(edit("preview", preview))).html).toContain(`>${preview}<`);
  });

  test("mail-render names the data file and the field, and writes nothing", () => {
    const cache = join(root, "node_modules", ".cache", "mail-test");
    mkdirSync(cache, { recursive: true });
    const dir = mkdtempSync(join(cache, "check-"));
    try {
      const file = join(dir, "missing-to.json");
      writeFileSync(file, JSON.stringify(edit("objection.mailto.to")));
      const run = spawnSync("bun", ["scripts/render.ts", file, "--out", join(dir, "out")], {
        cwd: root,
        encoding: "utf-8",
      });
      expect(run.status).toBe(1);
      expect(run.stdout).toBe("");
      expect(run.stderr).toContain(`mail-render: ${file}: objection.mailto.to`);
      writeFileSync(file, "{");
      const broken = spawnSync("bun", ["scripts/render.ts", file], {
        cwd: root,
        encoding: "utf-8",
      });
      expect(broken.status).toBe(1);
      expect(broken.stderr.startsWith(`mail-render: ${file}: `), broken.stderr).toBe(true);
      expect(readdirSync(dir)).toEqual(["missing-to.json"]);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});
