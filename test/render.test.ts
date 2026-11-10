import { describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { colors, tokens } from "@hackersandwizards/brand/tokens";
import type { BriefProps } from "../mails/Brief";
import { renderBrief } from "../scripts/render";
import data from "../catalog/mails/brief.json";

const brief = data as BriefProps;
const root = join(import.meta.dir, "..");

describe("renderBrief", async () => {
  const { html, text } = await renderBrief(brief);

  test("the HTML part carries the head a mail client needs", () => {
    expect(html).toContain('<html dir="ltr" lang="de">');
    expect(html).toContain('<meta name="viewport" content="width=device-width, initial-scale=1"/>');
    expect(html).toContain('<meta name="color-scheme" content="light dark"/>');
    expect(html).toContain(`<title>${brief.subject}</title>`);
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html).toContain("@media (prefers-color-scheme: dark)");
    expect(html).toContain("[data-ogsc] .hw-ink");
    expect(html).not.toMatch(/<link[^>]+stylesheet/);
    // Gmail clips a message above about 102 KB.
    expect(Buffer.byteLength(html)).toBeLessThan(102_000);
  });

  test("the HTML part holds every word of the data and the brand's colours", () => {
    for (const item of brief.items) {
      expect(html).toContain(item.title);
      expect(html).toContain(`href="${item.href}"`);
    }
    expect(html).toContain(brief.greeting);
    // No header: the signature's wordmark is the only one, after the greeting.
    expect(html.match(/>hackers<\/span>/g)).toHaveLength(1);
    expect(html.indexOf(brief.greeting)).toBeLessThan(html.indexOf(">hackers</span>"));
    expect(html).toContain(brief.signature.name);
    expect(html).toContain(`color:${colors["--color-teal"]}`);
    expect(html).toContain(
      'href="mailto:kim.beispiel@example.com?subject=Bitte%20keine%20Updates%20mehr&amp;body=',
    );
  });

  test("item titles are underlined links, labels take brand's label weight", () => {
    for (const item of brief.items) {
      const link = html.match(new RegExp(`<a href="${item.href}"[^>]*>`))?.[0];
      expect(link).toContain("text-decoration-line:underline");
      expect(link).not.toContain("text-decoration-line:none");
    }
    const labels = html.match(/<p class="hw-label"[^>]*>/g) ?? [];
    expect(labels).toHaveLength(brief.items.length);
    for (const label of labels)
      expect(label).toContain(`font-weight:${tokens["--type-label-weight"]}`);
  });

  test("the text part is written, not stripped: items, signature, the address without its query", () => {
    expect(text.startsWith(`${brief.greeting}\n\n`)).toBe(true);
    for (const item of brief.items) {
      expect(text).toContain(
        `${item.label.toUpperCase()}: ${item.title}\n${item.href}\n${item.text}`,
      );
    }
    expect(text).toContain(`-- \n${brief.signature.name}\n`);
    expect(text).toContain("mit dieser vorbereiteten Mail (kim.beispiel@example.com), ohne");
    expect(text).not.toContain("mailto:");
    expect(text).not.toContain("<");
  });
});

describe("mail-render", () => {
  test("writes the HTML and the text part from a data file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "mail-render-"));
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
      const mail = await renderBrief(brief);
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
