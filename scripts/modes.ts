/**
 * How a rendered mail looks where it lands, approximated in headless Chrome: light as sent, dark
 * as Apple Mail shows it (the mail's own dark styles), forced inversion as the Gmail app on iOS and
 * classic Outlook apply it (a CSS filter, close but not the same), and with images blocked.
 */
import { chromeBinary, INSTALL_HINT, NO_KEYCHAIN } from "@hackersandwizards/scaffolding/chrome";
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

/** Chrome for Testing from scaffolding's `./chrome`, headless; CHROME_BINARY overrides. */
export const launch = (): Promise<Browser> => {
  const executablePath = chromeBinary();
  if (!executablePath) throw new Error(INSTALL_HINT);
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-first-run", ...NO_KEYCHAIN],
  });
};

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
