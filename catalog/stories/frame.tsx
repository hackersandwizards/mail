import type { ReactNode } from "react";
import { render } from "react-email";
import { MailShell } from "../../components/MailShell";
import { forceDark } from "../../scripts/modes";
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
