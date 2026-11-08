/**
 * check:frames: opens the built catalog's home, every story page and every rendered mail over HTTP
 * under the Pages base and fails on an image that answers an error, fails to load or paints
 * nothing, or, lazy and hidden, does not decode, in any frame. A story's mail sits in a srcdoc frame, where a URL can resolve against the
 * story's page instead of the mail's.
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
    // Undecoded, so a path cannot step out of dist/.
    const path = new URL(req.url).pathname;
    if (!path.startsWith(BASE)) return new Response(null, { status: 404 });
    const file = join(DIST, path.slice(BASE.length));
    for (const candidate of [file, join(file, "index.html")])
      if (await Bun.file(candidate).exists()) return new Response(Bun.file(candidate));
    return new Response(null, { status: 404 });
  },
});
const root = `http://127.0.0.1:${server.port}${BASE}`;
// Every story page, and every mail as mail-render writes it.
const pages = (await readdir(DIST, { recursive: true }))
  .filter((f) => /^(dashboard|stories)\/.*index\.html$|^mails\/.*\.html$/.test(f))
  .map((f) => root + f.replace(/index\.html$/, ""));

// The mails alone would pass with no srcdoc frame opened.
if (pages.every((p) => p.startsWith(`${root}mails/`)))
  throw new Error("check:frames: the build holds no story page");

const failures: string[] = [];

async function check(url: string) {
  const page = await browser.newPage();
  // A background tab does not paint, and the home's tiles load after the first paint.
  await page.emulateFocusedPage(true);
  // Tall, so the home's lazy tiles all load.
  await page.setViewport({ width: 1280, height: 4000 });
  const bad = (why: string, src: string) => {
    if (!BLOCKED.test(src)) failures.push(`${url}: ${why} ${src}`);
  };
  page.on("requestfinished", (r) => {
    const status = r.response()?.status() ?? 0;
    // A tile's frame that answers an error holds no image to fail.
    if (["image", "document"].includes(r.resourceType()) && status >= 400)
      bad(String(status), r.url());
  });
  page.on("requestfailed", (r) => {
    if (r.resourceType() === "image") bad("failed", r.url());
  });
  // A page that is not there would show no image and pass.
  const answer = await page.goto(url);
  if (!answer?.ok()) failures.push(`${url}: the page answered ${answer?.status()}`);
  // A tile's frame has neither source until it starts loading.
  await page
    .waitForFunction(() => !document.querySelector("iframe:not([src],[srcdoc])"), { polling: 100 })
    .catch(() => failures.push(`${url}: a frame never started loading`));
  await page.waitForNetworkIdle();
  // A home without tile frames would show no image and pass.
  if (url === root && page.frames().length < 2) failures.push(`${url}: no tile frame opened`);
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
      for (let url; (url = queue.shift());) await check(url);
    }),
  );
} finally {
  await browser.close();
  await server.stop(true);
}
if (failures.length) {
  console.error(`check:frames: ${failures.length} image failure(s)\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`check:frames: ${pages.length + 1} pages, every image loads`);
