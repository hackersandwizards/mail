/**
 * How a rendered mail looks where it lands, approximated in headless Chrome: light as sent, dark
 * as Apple Mail shows it (the mail's own dark styles), forced inversion as the Gmail app on iOS and
 * classic Outlook apply it (a CSS filter, close but not the same), and with images blocked.
 */
import { chromeBinary, INSTALL_HINT, NO_KEYCHAIN } from "@hackersandwizards/scaffolding/chrome";
import type { Browser, Page } from "puppeteer-core";
import { INVERT } from "./frame-modes";

export const MODES = ["light", "dark", "invert", "noimg"] as const;
export type Mode = (typeof MODES)[number];
export type MailView = { mode: Mode; width: number };

/** Chrome for Testing from scaffolding's `./chrome`, headless; CHROME_BINARY overrides. Puppeteer
 * loads only when a browser run starts. */
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

/** Kill Chrome to keep teardown within the hook timeout under load, then close to clean its profile. */
export async function quit(browser: Browser): Promise<void> {
  browser.process()?.kill("SIGKILL");
  await browser.close();
}

/** Opens the mail file in one mode at one width; the caller closes the page. */
export async function openMail(
  browser: Browser,
  file: string,
  { mode, width }: MailView,
): Promise<Page> {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width, height: 800, deviceScaleFactor: 1 });
    await page.emulateMediaFeatures([
      { name: "prefers-color-scheme", value: mode === "dark" ? "dark" : "light" },
    ]);
    const interception = mode === "noimg" ? Promise.withResolvers<never>() : undefined;
    if (interception) {
      await page.setRequestInterception(true);
      page.on("request", (r) => {
        (r.resourceType() === "image" ? r.abort() : r.continue()).catch(interception.reject);
      });
    }
    const navigation = page.goto(`file://${file}`, { waitUntil: "load" });
    await (interception ? Promise.race([navigation, interception.promise]) : navigation);
    if (mode === "invert") await page.addStyleTag({ content: INVERT });
    return page;
  } catch (error) {
    try {
      await page.close();
    } catch (closeError) {
      const { ConnectionClosedError, ProtocolError } = await import("puppeteer-core");
      if (closeError instanceof ConnectionClosedError) throw error;
      if (
        closeError instanceof ProtocolError &&
        closeError.originalMessage === "No target with given id found"
      )
        throw error;
      throw new AggregateError(
        [error, closeError],
        "Opening the mail and closing its page failed",
        {
          cause: closeError,
        },
      );
    }
    throw error;
  }
}
