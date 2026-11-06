// The brand values a mail uses, every one from @hackersandwizards/brand: colours from its resolved
// token set (hex, since mail clients know no color-mix()), the label's colour from its label
// element, the two font stacks from its mail signature template, which carries the stacks a mail
// client can show (no web font: Gmail and classic Outlook load none). Server-side only: the
// template and the element are read from disk.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { colors, tokens } from "@hackersandwizards/brand/tokens";

const brandFile = (path: string) =>
  readFileSync(createRequire(import.meta.url).resolve(`@hackersandwizards/brand/${path}`), "utf-8");

/** The brand's mail signature templates, filled by `Signature`. */
export const signatureTemplate = {
  html: brandFile("mail-signature/template.html"),
  text: brandFile("mail-signature/template.txt"),
};

// The monospace stack quotes family names as &quot;, so the pattern reads past them.
const stacks = [
  ...signatureTemplate.html.matchAll(/font-family:\s*([^;"]+?(?:&quot;[^&]+&quot;[^;"]*?)*);/g),
].map((m) => m[1].replaceAll("&quot;", '"').trim());
const mono = stacks.find((s) => /monospace/.test(s));
const sans = stacks.find((s) => /sans-serif/.test(s));
if (!mono || !sans) throw new Error("mail: brand mail-signature template carries no font stack");
export const fonts = { mono, sans };

// The label element's colour token, light and night: the plain `.hw-label` rule before and inside
// its night scope.
const [labelLight, labelDark] = brandFile("elements/label.css")
  .split('@scope ([data-theme="dark"])')
  .map((css) => /\.hw-label\s*\{[^}]*?(?<![\w-])color:\s*var\((--color-[\w-]+)\)/.exec(css)?.[1])
  .map((token) => colors[token as keyof typeof colors]);
if (!labelLight || !labelDark)
  throw new Error("mail: brand label element carries no light and night colour");

/** Each colour role a mail paints, light as sent and dark as the mail's own dark styles set it.
 * `ampersand` and `purple` only the signature paints (its wordmark), reached by its inline colour. */
export const palette = {
  light: {
    page: colors["--color-white"],
    ink: colors["--color-ink"],
    muted: colors["--color-muted"],
    rule: colors["--color-border"],
    accent: colors["--color-teal"],
    label: labelLight,
    purple: colors["--color-purple"],
    ampersand: colors["--color-ampersand"],
    tint: colors["--color-tint"],
  },
  dark: {
    page: colors["--color-night"],
    ink: colors["--color-night-ink"],
    muted: colors["--color-night-muted"],
    rule: colors["--color-night-subtle"],
    accent: colors["--color-teal-night"],
    label: labelDark,
    purple: colors["--color-purple-night"],
    ampersand: colors["--color-ampersand-light"],
    tint: colors["--color-night-2"],
  },
} as const;

export type Role = keyof typeof palette.light;

/** The corner a picture takes, as brand's shape rule (tokens.css) gives a picture in a mail. */
export const corner = tokens["--radius-sm"];

/** The letter spacing of a label set in capitals. */
export const labelTracking = tokens["--tracking-label"];
