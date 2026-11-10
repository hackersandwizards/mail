/**
 * How a rendered mail looks where it lands, approximated in headless Chrome: light as sent, dark
 * as Apple Mail shows it (the mail's own dark styles), forced inversion as the Gmail app on iOS and
 * classic Outlook apply it (a CSS filter, close but not the same), and with images blocked.
 */
import { chromeBinary, INSTALL_HINT, NO_KEYCHAIN } from "@hackersandwizards/scaffolding/chrome";
import type { Browser, Page } from "puppeteer-core";
import { DARK_MEDIA } from "../components/MailShell";

export const MODES = ["light", "dark", "invert", "noimg"] as const;
export type Mode = (typeof MODES)[number];

function swap(html: string, from: string, to: string): string {
  if (!html.includes(from)) throw new Error(`modes: the mail holds no ${from}`);
  return html.replace(from, to);
}

/** The dark rules applied unconditionally, or never: a frame takes its colour scheme from the
 * page around it, which the viewer's system or the catalog's theme switch can turn dark. */
export const forceDark = (html: string) => swap(html, DARK_MEDIA, "@media all");
export const forceLight = (html: string) => swap(html, DARK_MEDIA, "@media not all");

// Pictures keep their colours, as the forced modes leave them.
const INVERT = "html,img{filter:invert(1) hue-rotate(180deg)}";

/** The inversion filter the forced dark modes come close to. */
export const forceInvert = (html: string) =>
  swap(forceLight(html), "</head>", `<style>${INVERT}</style></head>`);

/** Chrome for Testing from scaffolding's `./chrome`, headless; CHROME_BINARY overrides. Puppeteer
 * loads here, so a catalog story importing the string helpers above does not. */
export async function launch(): Promise<Browser> {
  const executablePath = chromeBinary();
  if (!executablePath) throw new Error(INSTALL_HINT);
  const { default: puppeteer } = await import("puppeteer-core");
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-first-run", ...NO_KEYCHAIN],
  });
}

/** Ends the browser by a kill. Chrome's graceful close took 0.1 to 3.3 s at a load of 100 to 200
 * and outran bun's 5 s hook limit in two gates; the kill took under 50 ms at the same load.
 * `close` then finds the process gone and only removes puppeteer's profile, which it does nowhere
 * else before this process exits. */
export async function quit(browser: Browser): Promise<void> {
  browser.process()?.kill("SIGKILL");
  await browser.close();
}

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
