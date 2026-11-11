import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { colors, tokens } from "@hackersandwizards/brand/tokens";
import type { BriefProps } from "../mails/Brief";
import { mailtoHref } from "../components/ObjectionNotice";
import { signatureTemplate, unreachedColours } from "../components/theme";
import { renderBrief } from "../scripts/render";
import data from "../catalog/mails/brief.json";

const brief = data as BriefProps;
const root = join(import.meta.dir, "..");
const mail = await renderBrief(brief);
/** A data string as React writes it into the HTML. */
const escaped = Bun.escapeHTML;

describe("renderBrief", () => {
  const { html, text } = mail;

  test("the HTML part carries the head a mail client needs", () => {
    expect(html).toContain('<html dir="ltr" lang="de">');
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1"/>');
    expect(html).toContain('<meta name="color-scheme" content="light dark"/>');
    expect(html).toContain(`<title>${escaped(brief.subject)}</title>`);
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html).toContain("@media (prefers-color-scheme: dark)");
    expect(html).toContain("[data-ogsc] .hw-ink");
    expect(html).not.toMatch(/<link[^>]+stylesheet/);
    // Gmail clips a message above about 102 KB.
    expect(Buffer.byteLength(html)).toBeLessThan(102_000);
  });

  test("the HTML part carries the links, one wordmark and the brand's colours", () => {
    for (const item of brief.items) expect(html).toContain(`href="${escaped(item.href)}"`);
    // No header: the signature's wordmark is the only one, after the greeting.
    expect(html.match(/>hackers<\/span>/g)).toHaveLength(1);
    expect(html.indexOf(escaped(brief.greeting))).toBeLessThan(html.indexOf(">hackers</span>"));
    expect(html).toContain(escaped(brief.signature.name));
    expect(html).toContain(`color:${colors["--color-teal"]}`);
    expect(html).toContain(
      'href="mailto:kim.beispiel@example.com?subject=Bitte%20keine%20Updates%20mehr&amp;body=',
    );
  });

  test("both parts hold every word the data gives the engine's own parts", () => {
    const words = [
      brief.greeting,
      ...brief.intro,
      ...brief.items.flatMap((item) => [item.title, item.text, item.destination!]),
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
    // Where each title leads, muted, right under the title.
    for (const item of brief.items)
      expect(html).toMatch(
        new RegExp(
          `${RegExp.escape(escaped(item.title))}</a></p><p class="hw-muted"[^>]*>${RegExp.escape(escaped(item.destination!))}</p>`,
        ),
      );
    const labels = html.match(/<p class="hw-label"[^>]*>/g) ?? [];
    expect(labels).toHaveLength(brief.items.length);
    const size = parseFloat(tokens["--text-label"]) * 16;
    for (const label of labels) {
      expect(label).toContain(`font-size:${size}px`);
      expect(label).toContain(
        `line-height:${+(size * Number(tokens["--text-label--line-height"])).toFixed(2)}px`,
      );
      expect(label).toContain(`font-weight:${tokens["--type-label-weight"]}`);
      expect(label).toContain(`letter-spacing:${tokens["--tracking-label"]}`);
      expect(label).toContain(`text-transform:${tokens["--type-label-case"]}`);
    }
  });

  test("a signature colour respelled or outside the roles has no dark rule", () => {
    const respelled = signatureTemplate.html.replace(/color: (#[0-9a-f]{6})/, "color:$1");
    expect(unreachedColours(respelled)).toHaveLength(1);
    expect(unreachedColours('<span style="color: #123456">')).toEqual(["color: #123456"]);
    expect(unreachedColours('<td style="background-color: #eef1f4">')).toEqual([
      "background-color: #eef1f4",
    ]);
    expect(unreachedColours('<td bgcolor="#eef1f4">')).toEqual(['bgcolor="#eef1f4']);
    // Not only hex: a named background, a functional border colour, a colour attribute.
    expect(
      unreachedColours(
        '<td style="background: white; border: 1px solid rgb(1, 2, 3)"><font color="navy">',
      ),
    ).toEqual(["background: white", "border: 1px solid rgb(1, 2, 3)", 'color="navy']);
    expect(unreachedColours('<table border="0" style="background: none; border: 0">')).toEqual([]);
  });

  test("the text part is written, not stripped: items, signature, the address without its query", () => {
    expect(text.startsWith(`${brief.greeting}\n\n`)).toBe(true);
    for (const item of brief.items) {
      expect(text).toContain(
        `${item.label.toUpperCase()}: ${item.title}\n${item.href}\n${item.destination}\n${item.text}\n`,
      );
    }
    expect(text).toContain(`\n\n${brief.signature.name}\n`);
    // No signature separator, under which a program would file the objection notice.
    expect(text).not.toMatch(/^-- $/m);
    expect(text).toContain("mit dieser vorbereiteten Mail (kim.beispiel@example.com), ohne");
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

test("a line break in the objection mail's body is encoded as CRLF (RFC 6068 section 5)", () => {
  expect(mailtoHref({ to: "kim@example.com", body: "Hallo,\nbitte nicht mehr." })).toBe(
    "mailto:kim@example.com?body=Hallo%2C%0D%0Abitte%20nicht%20mehr.",
  );
});
