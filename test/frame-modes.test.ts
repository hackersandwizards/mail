import { expect, test } from "vitest";
import data from "../catalog/mails/brief.json";
import { DARK_MEDIA } from "../components/MailShell";
import { forceDark, forceInvert } from "../scripts/frame-modes";
import { renderBrief } from "../scripts/render";

test("a subject containing the media rule stays intact while the catalog forces dark", async () => {
  const { html } = await renderBrief({ ...data, lang: "de", subject: DARK_MEDIA });
  const dark = forceDark(html);
  expect(dark).toContain(`<title>${DARK_MEDIA}</title>`);
  expect(dark).toContain("@media all{");
});

test("frame modes explain how to restore the missing dark stylesheet", () => {
  expect(() => forceDark(`<title>${DARK_MEDIA}</title>`)).toThrow(
    new Error(
      `modes: Without ${DARK_MEDIA} in a style element, the catalog cannot switch the mail between light and dark. Restore the darkStyle stylesheet in components/MailShell.tsx.`,
    ),
  );
});

test("the inverted frame explains how to restore the missing head close", () => {
  expect(() => forceInvert(`<style>${DARK_MEDIA}{}</style>`)).toThrow(
    new Error(
      "modes: The catalog needs </head> to insert the inversion filter. Restore the Head wrapper in components/MailShell.tsx so it renders a closing tag.",
    ),
  );
});
