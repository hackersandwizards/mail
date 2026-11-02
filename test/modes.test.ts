// Renders the specimen headless in each mode and reads what the reader would see. With MAIL_SHOTS
// set to a folder, also writes each view there as <mail>-<mode>-<width>.png for a review.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Browser } from "puppeteer-core";
import { palette } from "../components/theme";
import { MODES, launch, openMail } from "../scripts/modes";

const specimen = join(import.meta.dir, "..", "specimen");
const shots = process.env.MAIL_SHOTS;
const rgb = (hex: string) =>
  `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

let browser: Browser;
beforeAll(async () => {
  browser = await launch();
});
afterAll(async () => {
  await browser?.close();
});

describe.each(["brief", "brief-bild"])("specimen %s", (mail) => {
  test.each(MODES.flatMap((mode) => [600, 390].map((width) => [mode, width] as const)))(
    "%s at %i px",
    async (mode, width) => {
      const page = await openMail(browser, join(specimen, `${mail}.html`), mode, width);
      try {
        const seen = await page.evaluate(() => {
          const title = document.querySelector("p > a[href^='https://example.com/']");
          const img = document.querySelector("img");
          return {
            page: getComputedStyle(document.body).backgroundColor,
            title: title ? getComputedStyle(title).color : "",
            filter: getComputedStyle(document.documentElement).filter,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            imgBox: img
              ? [img.getBoundingClientRect().width, img.getBoundingClientRect().height]
              : null,
          };
        });
        const scheme = mode === "dark" ? palette.dark : palette.light;
        expect(seen.page).toBe(rgb(scheme.page));
        expect(seen.title).toBe(rgb(scheme.accent));
        expect(seen.filter).toBe(mode === "invert" ? "invert(1) hue-rotate(180deg)" : "none");
        expect(seen.overflow).toBe(0);
        // The box stays at its size whether the picture loaded or not.
        if (mail === "brief-bild") expect(seen.imgBox).toEqual([300, 152]);
        if (shots) {
          mkdirSync(shots, { recursive: true });
          const png = await page.screenshot({ fullPage: true, type: "png" });
          writeFileSync(join(shots, `${mail}-${mode}-${width}.png`), png);
        }
      } finally {
        await page.close();
      }
    },
  );
});
