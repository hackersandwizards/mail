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

/** A catalog mail's stories: light, dark and inverted at 600 px, light on a 390 px phone. */
export function mail(base: string) {
  const { html } = mails.find((m) => m.base === base)!;
  return {
    ...views(html),
    inverted: { args: { html: forceInvert(html), width: 600 } },
    phone: views(html, 390).light,
  };
}
