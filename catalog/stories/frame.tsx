import type { ReactNode } from "react";
import { render } from "react-email";
import { COLUMN_WIDTH, MailShell, PHONE_WIDTH } from "../../components/MailShell";
import { fonts, palette } from "../../components/theme";
import { forceDark, forceInvert, forceLight } from "../../scripts/modes";
import { mails } from "../mails";
import MailFrame from "./MailFrame.astro";

export const meta = { component: MailFrame };

/** One building block alone in the mail frame. */
export const part = (node: ReactNode) =>
  render(
    <MailShell lang="de" title="Baustein" preview="">
      {node}
    </MailShell>,
  );

/** The light and dark story of one rendered mail, each whatever the viewer's scheme. */
export function views(html: string) {
  return {
    light: { args: { html: forceLight(html), width: COLUMN_WIDTH } },
    dark: { args: { html: forceDark(html), width: COLUMN_WIDTH } },
  };
}

// A mail's data names its images relative to the mail's own page under /mails/; a srcdoc frame
// resolves them against the story's page. Each becomes a path from the root: Chrome fetched a
// root-relative <base href> against the story's page first, a 404 beside every working image.
const home = new URL(`${import.meta.env.BASE_URL.replace(/\/?$/, "/")}mails/`, "http://catalog");
const rooted = (html: string) =>
  html.replace(
    /(?<=\s)(src|href)="(?![a-z][a-z\d+.-]*:|[/#])([^"]+)"/gi,
    (_, name, url) => `${name}="${new URL(url, home).href.slice(home.origin.length)}"`,
  );

/** A text part as a mail program without HTML shows it: the lines as written, in a mono face. */
const textPage = (text: string, lang: string) =>
  `<!doctype html><html lang="${lang}"><body style="margin:0;padding:24px;background:${palette.light.page};color:${palette.light.ink}">` +
  `<pre style="margin:0;white-space:pre-wrap;font:13px/1.5 ${fonts.mono.replaceAll('"', "'")}">` +
  `${text.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</pre></body></html>`;

/** A catalog mail's stories: light, dark and inverted in the column, light on the narrowest phone,
 * and the text part. */
export function mail(base: string) {
  const found = mails.find((m) => m.base === base);
  if (!found) throw new Error(`mail(): no catalog/mails/${base}.json`);
  const html = rooted(found.html);
  return {
    ...views(html),
    text: {
      args: { html: textPage(found.text, JSON.parse(found.json).lang), width: COLUMN_WIDTH },
    },
    inverted: { args: { html: forceInvert(html), width: COLUMN_WIDTH } },
    phone: { args: { html: forceLight(html), width: PHONE_WIDTH } },
  };
}
