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

test("frame transforms report the missing stylesheet or missing head close", () => {
  expect(() => forceDark(`<title>${DARK_MEDIA}</title>`)).toThrow(
    `modes: the mail holds no ${DARK_MEDIA}`,
  );
  expect(() => forceInvert(`<style>${DARK_MEDIA}{}</style>`)).toThrow(
    "modes: the mail holds no </head>",
  );
});
