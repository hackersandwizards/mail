// The brand values a mail uses, every one from @hackersandwizards/brand: colours from its resolved
// token set (hex, since mail clients know no color-mix()), the picture corner and the label's type
// from its tokens, the two font stacks from its mail signature template, which carries the stacks a
// mail client can show (no web font: Gmail and classic Outlook load none). Server-side only: the
// template is read from disk.
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

/** Each colour role a mail paints, light as sent and dark as the mail's own dark styles set it.
 * `ampersand` and `purple` only the signature paints (its wordmark), reached by its inline colour. */
export const palette = {
  light: {
    page: colors["--color-white"],
    ink: colors["--color-ink"],
    muted: colors["--color-muted"],
    rule: colors["--color-border"],
    accent: colors["--color-teal"],
    label: colors["--color-label-text"],
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
    label: colors["--color-label-text-night"],
    purple: colors["--color-purple-night"],
    ampersand: colors["--color-ampersand-light"],
    tint: colors["--color-night-2"],
  },
} as const;
// A token brand renamed or dropped would paint `undefined` without an error.
for (const [mode, roles] of Object.entries(palette))
  for (const [role, hex] of Object.entries(roles))
    if (!hex)
      throw new Error(`mail: brand tokens carry no ${mode} ${role} colour (brand peer range)`);

export type Role = keyof typeof palette.light;
export const roles = Object.keys(palette.light) as Role[];

function plain(name: keyof typeof tokens, pattern: RegExp): string {
  if (!pattern.test(tokens[name]))
    throw new Error(`mail: brand token ${name} is no plain value (brand peer range)`);
  return tokens[name];
}

// A mail inlines these with no stylesheet behind them, so only a plain length holds.
const literal = (name: keyof typeof tokens) => plain(name, /^[\d.]+(px|em)$/);

/** The corner a picture takes, as brand's shape rule (tokens.css) gives a picture in a mail. */
export const corner = literal("--radius-sm");

// A mail inlines a rem length in pixels at the browsers' default root size: classic Outlook
// honours no rem.
function pixels(name: keyof typeof tokens): number {
  const rem = /^([\d.]+)rem$/.exec(tokens[name])?.[1];
  if (!rem) throw new Error(`mail: brand token ${name} is no rem length (brand peer range)`);
  return Number(rem) * 16;
}

const labelSize = pixels("--text-label");

/** The type of a label, as brand's label element sets it: mono, size, line height, weight, tracking
 * and case. The mail's mono stack has no medium face, so a client draws a medium weight in the
 * regular one. */
export const label = {
  fontFamily: fonts.mono,
  fontSize: `${labelSize}px`,
  lineHeight: `${+(labelSize * Number(plain("--text-label--line-height", /^[\d.]+$/))).toFixed(2)}px`,
  fontWeight: Number(plain("--type-label-weight", /^[1-9]00$/)),
  letterSpacing: literal("--tracking-label"),
  textTransform: plain("--type-label-case", /^(uppercase|lowercase|none)$/) as
    "uppercase" | "lowercase" | "none",
};

/** A label's words in the text part, in the case the HTML part sets them. */
export const labelText = (words: string) =>
  label.textTransform === "uppercase"
    ? words.toUpperCase()
    : label.textTransform === "lowercase"
      ? words.toLowerCase()
      : words;

/** A signature colour as brand's template spells it inline, which MailShell's dark rules match. */
export const inlineColour = (hex: string) => `color: ${hex}`;

/** Each colour of a signature template that no dark rule reaches: the dark rules repaint only an
 * inline text colour of a role, so a background, a border or a `bgcolor` stays light in dark mode. */
export const unreachedColours = (html: string) => [
  ...[...html.matchAll(/(?<![\w-])color\s*:\s*[^;"]+/gi)]
    .map(([declaration]) => declaration.trim())
    .filter((d) => !roles.some((r) => d === inlineColour(palette.light[r]))),
  ...[
    ...html.matchAll(
      /(?:background[\w-]*|border[\w-]*|bgcolor)\s*[:=]\s*[^;"]*#[0-9a-f]{3,8}[^;"]*/gi,
    ),
  ].map(([declaration]) => declaration.trim()),
];

const unreached = unreachedColours(signatureTemplate.html);
if (unreached.length)
  throw new Error(
    `mail: brand's mail signature paints ${unreached.join(", ")}, which no dark rule reaches (brand peer range)`,
  );
