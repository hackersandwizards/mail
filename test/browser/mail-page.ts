/**
 * How a rendered mail looks where it lands, approximated in headless Chrome: light as sent, dark
 * as Apple Mail shows it (the mail's own dark styles), forced inversion as the Gmail app on iOS and
 * classic Outlook apply it (a CSS filter, close but not the same), and with images blocked.
 */
import type { Browser, Page } from "puppeteer-core";
import { INVERT } from "../../scripts/frame-modes";

export const MODES = ["light", "dark", "invert", "noimg"] as const;
export type Mode = (typeof MODES)[number];
export type MailView = { mode: Mode; width: number };

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
    return rejectAfterClosingMailPage(page, error);
  }
}

/** Closes a failed preview page and reports any unexpected cleanup failure alongside the original. */
export async function rejectAfterClosingMailPage(
  page: Pick<Page, "close">,
  error: unknown,
): Promise<never> {
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
    throw new AggregateError([error, closeError], "Opening the mail and closing its page failed", {
      cause: closeError,
    });
  }
  throw error;
}
