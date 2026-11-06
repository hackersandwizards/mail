import type { ReactNode } from "react";
import { render } from "react-email";
import { MailShell } from "../../components/MailShell";
import { forceDark, forceInvert } from "../../scripts/modes";
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

/** The light and dark story of one rendered mail at a width. */
export function views(html: string, width = 600) {
  return { light: { args: { html, width } }, dark: { args: { html: forceDark(html), width } } };
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

/** A catalog mail's stories: light, dark and inverted at 600 px, light on a 390 px phone. */
export function mail(base: string) {
  const found = mails.find((m) => m.base === base);
  if (!found) throw new Error(`mail(): no catalog/mails/${base}.json`);
  const html = rooted(found.html);
  return {
    ...views(html),
    inverted: { args: { html: forceInvert(html), width: 600 } },
    phone: views(html, 390).light,
  };
}
