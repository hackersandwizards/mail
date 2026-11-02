#!/usr/bin/env bun
/**
 * Renders every data file in specimen/ to its HTML and text part beside it, and writes
 * specimen/index.html, which shows each mail light, dark, inverted and on a phone. All data is
 * invented. `--check` renders in memory and exits 1 where a committed file differs.
 *
 *   bun run specimen [--check]
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { BriefProps } from "../mails/Brief";
import { forceDark, forceInvert } from "./modes";
import { renderBrief } from "./render";

const dir = join(import.meta.dir, "..", "specimen");
const check = process.argv.includes("--check");

const attr = (s: string) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
const frame = (label: string, width: number, html: string) =>
  `<figure><figcaption>${label}</figcaption><iframe title="${label}" width="${width}" srcdoc="${attr(html)}" onload="this.style.height=this.contentDocument.documentElement.scrollHeight+'px'"></iframe></figure>`;

const files: Record<string, string> = {};
const sections: string[] = [];
for (const name of readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .sort()) {
  const base = name.replace(/\.json$/, "");
  const data: BriefProps = JSON.parse(readFileSync(join(dir, name), "utf-8"));
  const { html, text } = await renderBrief(data);
  files[`${base}.html`] = html;
  files[`${base}.txt`] = text;
  sections.push(
    `<section><h2>${data.subject}</h2><p><a href="${base}.json">Daten</a> · <a href="${base}.html">HTML-Teil</a> · <a href="${base}.txt">Textteil</a> · ${Math.round(html.length / 100) / 10} KB</p><div class="row">${[
      frame("hell, 600 px", 600, html),
      frame("dunkel wie Apple Mail, 600 px", 600, forceDark(html)),
      frame("erzwungene Umkehrung, 600 px", 600, forceInvert(html)),
      frame("Telefon, 390 px", 390, html),
    ].join("")}</div></section>`,
  );
}
files["index.html"] = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Mail-Engine: Specimen</title>
<link rel="icon" href="../node_modules/@hackersandwizards/brand/logos/favicon.svg">
<link rel="stylesheet" href="../node_modules/@hackersandwizards/brand/tokens/tokens.css">
<style>
body{margin:0;padding:var(--space-8,2rem);font-family:var(--font-sans);color:var(--color-ink);background:var(--color-bg)}
h1{font-family:var(--font-mono)}
.row{display:flex;flex-wrap:wrap;gap:1.5rem;align-items:flex-start}
figure{margin:0}
figcaption{font-family:var(--font-mono);font-size:var(--text-label);color:var(--color-muted);margin-bottom:.5rem}
iframe{border:1px solid var(--color-border);background:var(--color-white);height:900px}
a{color:var(--color-teal)}
</style>
</head>
<body>
<h1>Mail-Engine</h1>
<p>Jede Mail aus <code>specimen/*.json</code>, gerendert mit <code>bun run mail-render</code>. Alle Daten sind erfunden. Dunkel und Umkehrung sind Näherungen im Browser, keine echten Clients. Erzeugt von <code>bun run specimen</code>, nie von Hand bearbeiten.</p>
${sections.join("\n")}
</body>
</html>
`;

let stale = 0;
for (const [file, content] of Object.entries(files)) {
  const path = join(dir, file);
  if (check) {
    if (!existsSync(path) || readFileSync(path, "utf-8") !== content) {
      console.error(`specimen: ${file} is out of date, run bun run specimen`);
      stale++;
    }
  } else writeFileSync(path, content);
}
process.exit(stale ? 1 : 0);
