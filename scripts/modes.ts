import { chromeBinary, INSTALL_HINT, NO_KEYCHAIN } from "@hackersandwizards/scaffolding/chrome";
import type { Browser } from "puppeteer-core";

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
