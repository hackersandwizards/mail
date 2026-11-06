// The brand values a mail uses, every one from @hackersandwizards/brand: colours from its resolved
// token set (hex, since mail clients know no color-mix()), the two font stacks from its mail
// signature template, which carries the stacks a mail client can show (no web font: Gmail and
// classic Outlook load none). Server-side only: the template is read from disk.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { colors, tokens } from "@hackersandwizards/brand/tokens";

const signatureFile = (ext: "html" | "txt") =>
  createRequire(import.meta.url).resolve(`@hackersandwizards/brand/mail-signature/template.${ext}`);

/** The brand's mail signature templates, filled by `Signature`. */
export const signatureTemplate = {
  html: readFileSync(signatureFile("html"), "utf-8"),
  text: readFileSync(signatureFile("txt"), "utf-8"),
};

// The monospace stack quotes family names as &quot;, so the pattern reads past them.
const stacks = [
  ...signatureTemplate.html.matchAll(/font-family:\s*([^;"]+?(?:&quot;[^&]+&quot;[^;"]*?)*);/g),
].map((m) => m[1].replaceAll("&quot;", '"').trim());
const mono = stacks.find((s) => /monospace/.test(s));
const sans = stacks.find((s) => /sans-serif/.test(s));
if (!mono || !sans) throw new Error("mail: brand mail-signature template carries no font stack");
export const fonts = { mono, sans };

/** Each colour role a mail paints, light as sent and dark as the mail's own dark styles set it. */
export const palette = {
  light: {
    page: colors["--color-white"],
    ink: colors["--color-ink"],
    muted: colors["--color-muted"],
    rule: colors["--color-border"],
    accent: colors["--color-teal"],
    label: colors["--color-purple"],
    ampersand: colors["--color-ampersand"],
    tint: colors["--color-tint"],
  },
  dark: {
    page: colors["--color-night"],
    ink: colors["--color-night-ink"],
    muted: colors["--color-night-muted"],
    rule: colors["--color-night-subtle"],
    accent: colors["--color-teal-night"],
    label: colors["--color-purple-night"],
    ampersand: colors["--color-ampersand-light"],
    tint: colors["--color-night-2"],
  },
} as const;

export type Role = keyof typeof palette.light;

/** The brand corner a picture takes. */
export const corner = tokens["--radius-brand"];

/** The letter spacing of a label set in capitals. */
export const labelTracking = tokens["--tracking-label"];
