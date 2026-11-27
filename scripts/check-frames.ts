import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { BASE, resolveDistPath } from "./dist-path";
import { launch, quit } from "./modes";

const DIST = join(import.meta.dir, "../dist");
const BLOCKED = /\/blocked\.png$/;
// A tile's frame that fails holds no image to fail.
const WATCHED = ["image", "document"];

const notFound = () => new Response(null, { status: 404 });

const server = Bun.serve({
  port: 0,
  hostname: "127.0.0.1",
  async fetch(req) {
    const file = resolveDistPath(req.url, DIST);
    if (!file) return notFound();
    for (const candidate of [file, join(file, "index.html")])
      if (await Bun.file(candidate).exists()) return new Response(Bun.file(candidate));
    return notFound();
  },
});
const root = `http://127.0.0.1:${server.port}${BASE}`;
const pages = (await readdir(DIST, { recursive: true }))
  .filter((f) => /^(dashboard|stories)\/.*index\.html$|^mails\/.*\.html$/.test(f))
  .map((f) => root + f.replace(/index\.html$/, ""));

// The mails alone would pass with no srcdoc frame opened.
if (pages.every((p) => p.startsWith(`${root}mails/`)))
  throw new Error("check:frames: the build holds no story page");

const failures: string[] = [];

async function check(url: string) {
  const page = await browser.newPage();
  // Without focus a tab is hidden: it paints nothing and skips the tile loader a visitor gets.
  await page.emulateFocusedPage(true);
  // Tall, so the home's lazy tiles all load.
  await page.setViewport({ width: 1280, height: 4000 });
  const bad = (why: string, src: string) => {
    if (!BLOCKED.test(src)) failures.push(`${url}: ${why} ${src}`);
  };
  page.on("requestfinished", (r) => {
    const status = r.response()?.status() ?? 0;
    if (WATCHED.includes(r.resourceType()) && status >= 400) bad(String(status), r.url());
  });
  page.on("requestfailed", (r) => {
    if (WATCHED.includes(r.resourceType())) bad(r.failure()?.errorText ?? "failed", r.url());
  });
  const answer = await page.goto(url);
  if (!answer?.ok()) failures.push(`${url}: the page answered ${answer?.status()}`);
  // A tile's frame has neither source until it starts loading.
  await page.waitForFunction(() => !document.querySelector("iframe:not([src],[srcdoc])"), {
    polling: 100,
  });
  await page.waitForNetworkIdle();
  // A home without tile frames would show no image and pass.
  if (url === root && page.frames().length < 2) failures.push(`${url}: no tile frame opened`);
  if (url === root) {
    const last = await page.$$eval('link[rel="icon"]', (l) => l.at(-1)?.getAttribute("type"));
    if (last !== "image/svg+xml") failures.push(`${url}: the last icon link is not the svg`);
  }
  for (const frame of page.frames().filter((f) => !f.detached)) {
    // A lazy image the page hides never loads, such as the header's night lockup on a light
    // page: a copy of it must decode instead.
    const found = await frame.evaluate(() =>
      Promise.all(
        [...document.images]
          .filter((i) => !i.naturalWidth)
          .map(async (i): Promise<[string, string] | null> => {
            const src = i.currentSrc || i.src;
            if (i.loading !== "lazy" || i.getClientRects().length || !i.getAttribute("src"))
              return ["painted nothing", src];
            const copy = new Image();
            copy.src = src;
            return copy.decode().then(
              () => null,
              () => ["hidden and does not decode", src],
            );
          }),
      ),
    );
    for (const [why, src] of found.filter((f) => f !== null)) bad(why, src);
  }
  await page.close();
}

const browser = await launch();
try {
  const queue = [root, ...pages];
  // Sixteen pages at a time; each waits half a second of network quiet.
  await Promise.all(
    Array.from({ length: 16 }, async () => {
      for (let url; (url = queue.shift());)
        await check(url).catch((e: Error) => failures.push(`${url}: ${e.message}`));
    }),
  );
} finally {
  await quit(browser);
  await server.stop(true);
}
if (failures.length) {
  console.error(`check:frames: ${failures.length} failure(s)\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`check:frames: ${pages.length + 1} pages, every page, frame and image loads`);
