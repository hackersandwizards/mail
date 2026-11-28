// Set MAIL_SHOTS to a folder to save each view as a PNG named by mail, mode and width.
import { assert, afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { rejection } from "@hackersandwizards/scaffolding/rejection";
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
import { ConnectionClosedError, type Browser, type Page } from "puppeteer-core";
import { MAX_IMAGE_WIDTH } from "../../components/Image";
import { COLUMN_WIDTH, PHONE_WIDTH } from "../../components/MailShell";
import { palette, roles } from "../../components/theme";
import { parseBrief, renderBrief } from "../../scripts/render";
import { browserScope, MODES, openMail, type MailView, type Mode } from "./mail-page";

// Each mail goes one folder down beside a link to brand at its package path, as in the built
// catalog, so the image its data names by a relative path loads.
const cache = fileURLToPath(new URL("../../node_modules/.cache/mail-test", import.meta.url));
mkdirSync(cache, { recursive: true });
const tmp = mkdtempSync(join(cache, "modes-"));
const dir = join(tmp, "mails");
const shots = process.env.MAIL_SHOTS;
const data = fileURLToPath(new URL("../../catalog/mails", import.meta.url));
const mails = Object.fromEntries(
  readdirSync(data)
    .filter((f) => f.endsWith(".json"))
    .map((f) => [f.slice(0, -5), parseBrief(readFileSync(join(data, f), "utf8"))]),
);
const catalogViews: MailView[] = MODES.flatMap((mode) =>
  [COLUMN_WIDTH, PHONE_WIDTH].map((width) => ({ mode, width })),
);
const widestViews: MailView[] = [
  { mode: "light", width: PHONE_WIDTH },
  { mode: "noimg", width: PHONE_WIDTH },
];
const mailViews = [
  ...Object.keys(mails).map((mail) => ({ mail, views: catalogViews })),
  { mail: "widest-image", views: widestViews },
];
const widest = structuredClone(mails["brief-bild"]);
const picture = widest.items[0].image;
assert(picture, "brief-bild should supply the widest-image fixture with a picture");
widest.items[0].image = { ...picture, width: MAX_IMAGE_WIDTH, height: 160 };
mails["widest-image"] = widest;
const rgb = (hex: string) =>
  `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

const suiteBrowser = browserScope();
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
  browser = await suiteBrowser.launch();
});
afterAll(async () => {
  try {
    await suiteBrowser.close();
  } finally {
    rmSync(tmp, { recursive: true });
  }
});

test("a failed navigation closes the page it opened", async () => {
  const count = (await browser.pages()).length;
  const error = await rejection(
    openMail(browser, join(dir, "missing.html"), { mode: "noimg", width: PHONE_WIDTH }),
  );
  expect(error).toContain("ERR_FILE_NOT_FOUND");
  expect(await browser.pages()).toHaveLength(count);
});

test("a page closed during navigation preserves the navigation error", async () => {
  const page = await browser.newPage();
  const navigationFailure = new Error("navigation failed after the page closed");
  const newPage = vi.spyOn(browser, "newPage").mockResolvedValueOnce(page);
  const goto = vi.spyOn(page, "goto").mockImplementationOnce(async () => {
    await page.close();
    throw navigationFailure;
  });
  try {
    const error = await openMail(browser, join(dir, "brief-bild.html"), {
      mode: "light",
      width: PHONE_WIDTH,
    }).catch((failure: unknown) => failure);
    expect(error).toBe(navigationFailure);
  } finally {
    goto.mockRestore();
    newPage.mockRestore();
  }
});

const navigationFailure = new Error("navigation failed before cleanup");
const closeFailure = new Error("could not close the page");
test.each([
  {
    reason: "the browser disconnected",
    failure: new ConnectionClosedError("Connection closed."),
    expected: navigationFailure,
  },
  {
    reason: "cleanup failed unexpectedly",
    failure: closeFailure,
    expected: { name: "AggregateError", errors: [navigationFailure, closeFailure] },
  },
])("preserves the errors when $reason", async ({ failure, expected }) => {
  const page = await browser.newPage();
  const newPage = vi.spyOn(browser, "newPage").mockResolvedValueOnce(page);
  const goto = vi.spyOn(page, "goto").mockRejectedValueOnce(navigationFailure);
  const close = vi.spyOn(page, "close").mockRejectedValueOnce(failure);
  try {
    const error = await openMail(browser, join(dir, "brief-bild.html"), {
      mode: "light",
      width: PHONE_WIDTH,
    }).catch((failure: unknown) => failure);
    expect(error).toMatchObject(expected);
  } finally {
    close.mockRestore();
    goto.mockRestore();
    newPage.mockRestore();
    await page.close();
  }
});

test("blocked images mode uses light colours even when Chrome defaults to dark mode", async ({
  onTestFinished,
}) => {
  const scope = browserScope();
  onTestFinished(scope.close);
  const darkBrowser = await scope.launch(["--force-dark-mode"]);
  const [blank] = await darkBrowser.pages();
  expect(await blank.evaluate(() => matchMedia("(prefers-color-scheme: dark)").matches)).toBe(true);
  const page = await openMail(darkBrowser, join(dir, "brief-bild.html"), {
    mode: "noimg",
    width: PHONE_WIDTH,
  });
  expect(await page.evaluate(() => matchMedia("(prefers-color-scheme: light)").matches)).toBe(true);
});

const display = {
  light: { scheme: palette.light, filter: "none" },
  dark: { scheme: palette.dark, filter: "none" },
  invert: { scheme: palette.light, filter: "invert(1) hue-rotate(180deg)" },
  noimg: { scheme: palette.light, filter: "none" },
} satisfies Record<
  Mode,
  {
    scheme: (typeof palette)["light" | "dark"];
    filter: string;
  }
>;

const captureView = shots
  ? async (page: Page, name: string) => {
      mkdirSync(shots, { recursive: true });
      const png = await page.screenshot({ fullPage: true, type: "png" });
      writeFileSync(join(shots, name), png);
    }
  : () => Promise.resolve();

describe.each(mailViews)("mail $mail", ({ mail, views }) => {
  const image = mails[mail].items.find((item) => item.image)?.image;
  const cases = views.map((view) => ({
    ...view,
    expectedPictures: image
      ? [{ loaded: view.mode !== "noimg", box: [image.width, image.height] }]
      : [],
  }));
  test.each(cases)("$mode at $width px", async ({ expectedPictures, ...view }) => {
    const { mode, width } = view;
    const { scheme, filter } = display[mode];
    const page = await openMail(browser, join(dir, `${mail}.html`), view);
    try {
      // React Email's inner Body cell, which the dark rules reach by structure.
      const seen = await page.$eval(".hw-body>table>tbody>tr>td", (cell) => {
        const paintProperties = new Set(["color", "background-color", "border-left-color"]);
        return {
          page: getComputedStyle(document.body).backgroundColor,
          cell: getComputedStyle(cell).backgroundColor,
          sig: document.querySelectorAll(".hw-sig [style*='color']").length,
          painted: [...document.querySelectorAll<HTMLElement>("[style]")].flatMap((e) =>
            [...new Set(Array.from(e.style)).intersection(paintProperties)]
              // A border shorthand without a colour leaves the keyword, which paints no role.
              .filter(
                (prop) => !/^(currentcolor|transparent)$/i.test(e.style.getPropertyValue(prop)),
              )
              .map(
                (prop) =>
                  [
                    prop,
                    e.style.getPropertyValue(prop),
                    getComputedStyle(e).getPropertyValue(prop),
                  ] as const,
              ),
          ),
          filter: getComputedStyle(document.documentElement).filter,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          pictures: Array.from(document.images)
            .slice(0, 1)
            .map((img) => {
              const { width, height } = img.getBoundingClientRect();
              return {
                loaded: [img.complete, img.naturalWidth > 0].every(Boolean),
                box: [width, height],
              };
            }),
        };
      });
      const title = await page.$eval(
        "p > a[href^='https://example.com/']",
        (link) => getComputedStyle(link).color,
      );
      const { sig, painted, pictures, ...layout } = seen;
      expect({ ...layout, title }).toEqual({
        page: rgb(scheme.page),
        cell: rgb(scheme.page),
        title: rgb(scheme.accent),
        filter,
        overflow: 0,
      });
      expect(sig).toBeGreaterThan(0);
      expect(painted.length).toBeGreaterThan(sig);
      for (const [prop, inline, shown] of painted) {
        const shownAs = roles
          .filter((role) => rgb(palette.light[role]) === inline)
          .map((role) => rgb(scheme[role]));
        expect(shownAs.length, `${prop} ${inline} is no role's colour`).toBeGreaterThan(0);
        expect(shownAs, `${prop} ${inline}`).toContain(shown);
      }
      expect(pictures).toEqual(expectedPictures);
      await captureView(page, `${mail}-${mode}-${width}.png`);
    } finally {
      await page.close();
    }
  });
});
