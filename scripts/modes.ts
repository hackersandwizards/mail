/**
 * How a rendered mail looks where it lands, approximated in headless Chrome: light as sent, dark
 * as Apple Mail shows it (the mail's own dark styles), forced inversion as the Gmail app on iOS and
 * classic Outlook apply it (a CSS filter, close but not the same), and with images blocked.
 */
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import puppeteer, { type Browser, type Page } from "puppeteer-core";

export const MODES = ["light", "dark", "invert", "noimg"] as const;
export type Mode = (typeof MODES)[number];

/** The dark rules applied unconditionally, for a frame that cannot emulate the colour scheme. */
export const forceDark = (html: string) =>
  html.replace("@media (prefers-color-scheme: dark)", "@media all");

// Pictures keep their colours, as the forced modes leave them.
const INVERT = "html,img{filter:invert(1) hue-rotate(180deg)}";

/** The inversion filter the forced dark modes come close to. */
export const forceInvert = (html: string) =>
  html.replace("</head>", `<style>${INVERT}</style></head>`);

/**
 * Chrome for Testing, the newest build in puppeteer's cache, never the user's own Chrome: a headless
 * instance from the user's app is activated by macOS. CHROME_BINARY overrides.
 */
export function chromeBinary(): string {
  if (process.env.CHROME_BINARY) return process.env.CHROME_BINARY;
  const builds = join(
    process.env.PUPPETEER_CACHE_DIR ?? join(homedir(), ".cache", "puppeteer"),
    "chrome",
  );
  const exe =
    process.platform === "darwin"
      ? "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
      : "chrome";
  const found = (existsSync(builds) ? readdirSync(builds) : [])
    .sort((a, b) => b.localeCompare(a, "en", { numeric: true }))
    .flatMap((build) =>
      existsSync(join(builds, build))
        ? readdirSync(join(builds, build))
            .filter((dir) => dir.startsWith("chrome-"))
            .map((dir) => join(builds, build, dir, exe))
        : [],
    )
    .find((path) => existsSync(path));
  if (!found) {
    throw new Error(
      "Chrome for Testing not found: bunx @puppeteer/browsers@3.2.6 install chrome@stable --path ~/.cache/puppeteer, or set CHROME_BINARY",
    );
  }
  return found;
}

export const launch = (): Promise<Browser> =>
  puppeteer.launch({ executablePath: chromeBinary(), headless: true, args: ["--no-first-run"] });

/** Opens the mail file in one mode at one width; the caller closes the page. */
export async function openMail(
  browser: Browser,
  file: string,
  mode: Mode,
  width: number,
): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 800, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: mode === "dark" ? "dark" : "light" },
  ]);
  if (mode === "noimg") {
    await page.setRequestInterception(true);
    page.on("request", (r) => (r.resourceType() === "image" ? r.abort() : r.continue()));
  }
  await page.goto(`file://${file}`, { waitUntil: "load" });
  if (mode === "invert") await page.addStyleTag({ content: INVERT });
  return page;
}

/** Screenshots the mail file in one mode at one width, the full page, as PNG bytes. */
export async function shoot(browser: Browser, file: string, mode: Mode, width: number) {
  const page = await openMail(browser, file, mode, width);
  try {
    return await page.screenshot({ fullPage: true, type: "png" });
  } finally {
    await page.close();
  }
}
