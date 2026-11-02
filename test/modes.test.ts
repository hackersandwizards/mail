// Renders each catalog mail headless in each mode and reads what the reader would see. With MAIL_SHOTS
// set to a folder, also writes each view there as <mail>-<mode>-<width>.png for a review.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Browser } from "puppeteer-core";
import { palette } from "../components/theme";
import type { BriefProps } from "../mails/Brief";
import brief from "../catalog/mails/brief.json";
import briefBild from "../catalog/mails/brief-bild.json";
import { MODES, launch, openMail } from "../scripts/modes";
import { renderBrief } from "../scripts/render";

// Each mail goes one folder down beside a node_modules link, as in the built catalog, so the
// image its data names by a relative path loads.
const tmp = mkdtempSync(join(tmpdir(), "mail-modes-"));
const dir = join(tmp, "mails");
const shots = process.env.MAIL_SHOTS;
const rgb = (hex: string) =>
  `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

let browser: Browser;
beforeAll(async () => {
  mkdirSync(dir);
  symlinkSync(join(import.meta.dir, "..", "node_modules"), join(tmp, "node_modules"));
  for (const [name, data] of Object.entries({ brief, "brief-bild": briefBild }))
    writeFileSync(join(dir, `${name}.html`), (await renderBrief(data as BriefProps)).html);
  browser = await launch();
});
afterAll(async () => {
  await browser?.close();
  rmSync(tmp, { recursive: true });
});

describe.each(["brief", "brief-bild"])("mail %s", (mail) => {
  test.each(MODES.flatMap((mode) => [600, 390].map((width) => [mode, width] as const)))(
    "%s at %i px",
    async (mode, width) => {
      const page = await openMail(browser, join(dir, `${mail}.html`), mode, width);
      try {
        const seen = await page.evaluate(() => {
          const title = document.querySelector("p > a[href^='https://example.com/']");
          const img = document.querySelector("img");
          return {
            page: getComputedStyle(document.body).backgroundColor,
            title: title ? getComputedStyle(title).color : "",
            filter: getComputedStyle(document.documentElement).filter,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            loaded: img ? img.complete && img.naturalWidth > 0 : null,
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
        if (mail === "brief-bild") {
          expect(seen.loaded).toBe(mode !== "noimg");
          expect(seen.imgBox).toEqual([300, 152]);
        }
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
