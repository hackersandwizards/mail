/** The CSS inversion filter approximates forced dark mode in Gmail on iOS and classic Outlook. */
import type { Browser, Page } from "puppeteer-core";
import { launch, quit } from "../../scripts/modes";
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

/** A launch that a hook Vitest runs after a timeout can close, the launch still pending included. */
export function browserScope() {
  const controller = new AbortController();
  let browser: Browser | undefined;
  return {
    async launch(args?: string[]) {
      const opened = await launch(args, controller.signal);
      if (controller.signal.aborted) {
        await quit(opened);
        controller.signal.throwIfAborted();
      }
      browser = opened;
      return opened;
    },
    async close() {
      controller.abort();
      if (browser) await quit(browser);
    },
  };
}
