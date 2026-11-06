/**
 * check:frames: opens the built catalog's home and every story page over HTTP under the Pages base
 * and fails on an image that answers an error, fails to load or paints nothing, in any frame. A
 * story's mail sits in a srcdoc frame, where a URL can resolve against the story's page instead of
 * the mail's (Brief-Bild fetched its picture from the story's folder, a 404, on 2026-11-06).
 */
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { launch } from "./modes";

const DIST = join(import.meta.dir, "../dist");
// The catalog's base, set in catalog/astro.config.ts.
const BASE = "/mail/";
// The Image part's blocked stories name a source that never loads, on purpose.
const BLOCKED = /\/blocked\.png$/;

const server = Bun.serve({
  port: 0,
  hostname: "127.0.0.1",
  async fetch(req) {
    const path = decodeURIComponent(new URL(req.url).pathname);
    if (!path.startsWith(BASE)) return new Response(null, { status: 404 });
    const file = join(DIST, path.slice(BASE.length));
    for (const candidate of [file, join(file, "index.html")])
      if (await Bun.file(candidate).exists()) return new Response(Bun.file(candidate));
    return new Response(null, { status: 404 });
  },
});
const root = `http://127.0.0.1:${server.port}${BASE}`;
const stories = (await readdir(DIST, { recursive: true }))
  .filter((f) => /^(dashboard|stories)\/.*index\.html$/.test(f))
  .map((f) => root + f.replace(/index\.html$/, ""));

const failures: string[] = [];
const browser = await launch();
try {
  for (const url of [root, ...stories]) {
    const page = await browser.newPage();
    const bad = (why: string) => (u: string) =>
      BLOCKED.test(u) || failures.push(`${url}: ${why} ${u}`);
    page.on("requestfinished", (r) => {
      const status = r.response()?.status() ?? 0;
      if (r.resourceType() === "image" && status >= 400) bad(String(status))(r.url());
    });
    page.on("requestfailed", (r) => r.resourceType() === "image" && bad("failed")(r.url()));
    await page.goto(url, { waitUntil: "networkidle0" });
    for (const frame of page.frames()) {
      const unpainted = await frame.evaluate(() =>
        [...document.images].filter((i) => !i.naturalWidth).map((i) => i.currentSrc || i.src),
      );
      unpainted.forEach(bad("painted nothing"));
    }
    await page.close();
  }
} finally {
  await browser.close();
  await server.stop(true);
}
if (failures.length) {
  console.error(`check:frames: ${failures.length} broken image(s)\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`check:frames: ${stories.length + 1} pages, every image loads`);
