// Renders each catalog mail headless in each mode and reads what the reader would see. With MAIL_SHOTS
// set to a folder, also writes each view there as <mail>-<mode>-<width>.png for a review.
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Browser } from "puppeteer-core";
import { palette } from "../components/theme";
import type { BriefProps } from "../mails/Brief";
import { MODES, launch, openMail } from "../scripts/modes";
import { renderBrief } from "../scripts/render";

// Each mail goes one folder down beside a node_modules link, as in the built catalog, so the
// image its data names by a relative path loads.
const tmp = mkdtempSync(join(tmpdir(), "mail-modes-"));
const dir = join(tmp, "mails");
const shots = process.env.MAIL_SHOTS;
const data = join(import.meta.dir, "..", "catalog", "mails");
const mails = Object.fromEntries(
  readdirSync(data)
    .filter((f) => f.endsWith(".json"))
    .map((f) => [f.slice(0, -5), JSON.parse(readFileSync(join(data, f), "utf8")) as BriefProps]),
);
const rgb = (hex: string) =>
  `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

let browser: Browser;
beforeAll(async () => {
  mkdirSync(dir);
  symlinkSync(join(import.meta.dir, "..", "node_modules"), join(tmp, "node_modules"));
  for (const [name, props] of Object.entries(mails))
    writeFileSync(join(dir, `${name}.html`), (await renderBrief(props)).html);
  browser = await launch();
});
afterAll(async () => {
  await browser?.close();
  rmSync(tmp, { recursive: true });
});

describe.each(Object.keys(mails))("mail %s", (mail) => {
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
            // React Email's inner Body cell and the brand signature, which the dark rules reach by
            // structure and by inline colour.
            cell: getComputedStyle(document.querySelector(".hw-body>table>tbody>tr>td")!)
              .backgroundColor,
            sig: [...document.querySelectorAll(".hw-sig [style*='color']")].map(
              (e) => getComputedStyle(e).color,
            ),
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
        expect(seen.cell).toBe(rgb(scheme.page));
        expect(seen.sig.length).toBeGreaterThan(0);
        for (const color of seen.sig) expect(Object.values(scheme).map(rgb)).toContain(color);
        expect(seen.title).toBe(rgb(scheme.accent));
        expect(seen.filter).toBe(mode === "invert" ? "invert(1) hue-rotate(180deg)" : "none");
        expect(seen.overflow).toBe(0);
        // The box stays at its size whether the picture loaded or not.
        const image = mails[mail].items.find((item) => item.image)?.image;
        if (image) {
          expect(seen.loaded).toBe(mode !== "noimg");
          expect(seen.imgBox).toEqual([image.width, image.height]);
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
