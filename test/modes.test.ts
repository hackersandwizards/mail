// Renders each catalog mail, and one with an image at the widest allowed, headless in each mode and
// reads what the reader would see. With MAIL_SHOTS set to a folder, also writes each view there as
// <mail>-<mode>-<width>.png for a review.
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
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Browser } from "puppeteer-core";
import { MAX_IMAGE_WIDTH } from "../components/Image";
import { COLUMN_WIDTH, PHONE_WIDTH } from "../components/MailShell";
import { palette, roles } from "../components/theme";
import type { BriefProps } from "../mails/Brief";
import { MODES, launch, openMail, quit } from "../scripts/modes";
import { renderBrief } from "../scripts/render";

// Each mail goes one folder down beside a link to brand at its package path, as in the built
// catalog, so the image its data names by a relative path loads.
const cache = join(import.meta.dir, "..", "node_modules", ".cache", "mail-test");
mkdirSync(cache, { recursive: true });
const tmp = mkdtempSync(join(cache, "modes-"));
const dir = join(tmp, "mails");
const shots = process.env.MAIL_SHOTS;
const data = join(import.meta.dir, "..", "catalog", "mails");
const mails = Object.fromEntries(
  readdirSync(data)
    .filter((f) => f.endsWith(".json"))
    .map((f) => [f.slice(0, -5), JSON.parse(readFileSync(join(data, f), "utf8")) as BriefProps]),
);
const widest = structuredClone(mails["brief-bild"]);
widest.items[0].image = { ...widest.items[0].image!, width: MAX_IMAGE_WIDTH, height: 160 };
mails["widest-image"] = widest;
const rgb = (hex: string) =>
  `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

let browser: Browser;
beforeAll(async () => {
  mkdirSync(dir);
  mkdirSync(join(tmp, "@hackersandwizards"));
  symlinkSync(
    dirname(fileURLToPath(import.meta.resolve("@hackersandwizards/brand/package.json"))),
    join(tmp, "@hackersandwizards", "brand"),
  );
  for (const [name, props] of Object.entries(mails))
    writeFileSync(join(dir, `${name}.html`), (await renderBrief(props)).html);
  browser = await launch();
});
afterAll(async () => {
  rmSync(tmp, { recursive: true });
  if (browser) await quit(browser);
});

describe.each(Object.keys(mails))("mail %s", (mail) => {
  test.each(MODES.flatMap((mode) => [COLUMN_WIDTH, PHONE_WIDTH].map((w) => [mode, w] as const)))(
    "%s at %i px",
    async (mode, width) => {
      const page = await openMail(browser, join(dir, `${mail}.html`), mode, width);
      try {
        const seen = await page.evaluate(() => {
          const title = document.querySelector("p > a[href^='https://example.com/']");
          const img = document.querySelector("img");
          return {
            page: getComputedStyle(document.body).backgroundColor,
            // React Email's inner Body cell, which the dark rules reach by structure.
            cell: getComputedStyle(document.querySelector(".hw-body>table>tbody>tr>td")!)
              .backgroundColor,
            sig: document.querySelectorAll(".hw-sig [style*='color']").length,
            // Every colour an element sets inline, with the colour it shows.
            painted: [...document.querySelectorAll<HTMLElement>("[style]")].flatMap((e) =>
              (["color", "backgroundColor", "borderLeftColor"] as const)
                // A border shorthand without a colour leaves the keyword, which paints no role.
                .filter(
                  (prop) => e.style[prop] && !/^(currentcolor|transparent)$/i.test(e.style[prop]),
                )
                .map((prop) => [prop, e.style[prop], getComputedStyle(e)[prop]]),
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
        expect(seen.sig).toBeGreaterThan(0);
        // Each colour set inline, the signature's included, is a role's colour as sent and shows as
        // that role's colour in the mode: a part setting a colour without its class stays light.
        expect(seen.painted.length).toBeGreaterThan(seen.sig);
        for (const [prop, inline, shown] of seen.painted) {
          const shownAs = roles
            .filter((r) => rgb(palette.light[r]) === inline)
            .map((r) => rgb(scheme[r]));
          expect(shownAs.length, `${prop} ${inline} is no role's colour`).toBeGreaterThan(0);
          expect(shownAs, `${prop} ${inline}`).toContain(shown);
        }
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
