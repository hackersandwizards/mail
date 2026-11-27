// The brand values a mail uses. Colours come as resolved hex, since mail clients know no
// color-mix(); the font stacks hold no web font, since Gmail and classic Outlook load none.
// Server-side only: the signature template is read from disk.
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import brandFonts from "@hackersandwizards/brand/fonts.json" with { type: "json" };
import { colors, tokens } from "@hackersandwizards/brand/tokens";
import { findUnreachedColours } from "./signature-colours";

const brandFile = (path: string) =>
  readFileSync(createRequire(import.meta.url).resolve(`@hackersandwizards/brand/${path}`), "utf-8");

/** The brand's mail signature templates, filled by `Signature`. */
export const signatureTemplate = {
  html: brandFile("mail-signature/template.html"),
  text: brandFile("mail-signature/template.txt"),
};

/** The sans and mono stacks, which brand generates from its mail signature template. */
export const fonts = brandFonts.mail;

/** Each colour role a mail paints, light as sent and dark as the mail's own dark styles set it.
 * `ampersand`, `purple` and `rule` only the signature paints (its wordmark and separators), reached
 * by its inline colour. */
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
      throw new Error(
        `mail: The ${mode} ${role} colour is missing, so the mail cannot paint that role. Install a brand version within mail's peerDependencies range in package.json, or update the palette mapping in components/theme.ts to the current exported colour token if the installed version is in range.`,
      );

export type Role = keyof typeof palette.light;
export const roles = Object.keys(palette.light) as Role[];

function plain(name: keyof typeof tokens, pattern: RegExp, expected: string): string {
  if (!pattern.test(tokens[name]))
    throw new Error(
      `mail: Brand token ${name} must be ${expected} to work in an inline mail style. Install a brand version within mail's peerDependencies range in package.json, or update the relevant plain() caller in components/theme.ts to use the current exported token if the installed version is in range.`,
    );
  return tokens[name];
}

// A mail inlines these with no stylesheet behind them, so only a plain length holds.
const literal = (name: keyof typeof tokens) =>
  plain(name, /^[\d.]+(px|em)$/, "a numeric px or em length");

/** The corner a picture takes, as brand's shape rule (tokens.css) gives a picture in a mail. */
export const corner = literal("--radius-sm");

// A mail inlines a rem length in pixels at the browsers' default root size: classic Outlook
// honours no rem.
function pixels(name: keyof typeof tokens): number {
  const rem = /^([\d.]+)rem$/.exec(tokens[name])?.[1];
  if (!rem)
    throw new Error(
      `mail: The mail needs a rem length for brand token ${name} to convert it to pixels. Install a brand version within mail's peerDependencies range in package.json, or update the pixels() caller in components/theme.ts to use the current exported token if the installed version is in range.`,
    );
  return Number(rem) * 16;
}

const labelSize = pixels("--text-label");

/** The type of a label, as brand's label element sets it: mono, size, line height, weight, tracking
 * and case. The mail's mono stack has no medium face, so a client draws a medium weight in the
 * regular one. */
export const label = {
  fontFamily: fonts.mono,
  fontSize: `${labelSize}px`,
  lineHeight: `${+(labelSize * Number(plain("--text-label--line-height", /^[\d.]+$/, "a unitless number"))).toFixed(2)}px`,
  fontWeight: Number(plain("--type-label-weight", /^[1-9]00$/, "a whole hundred from 100 to 900")),
  letterSpacing: literal("--tracking-label"),
  textTransform: plain(
    "--type-label-case",
    /^(uppercase|lowercase|none)$/,
    "uppercase, lowercase or none",
  ) as "uppercase" | "lowercase" | "none",
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

export const unreachedColours = (html: string) =>
  findUnreachedColours(
    html,
    roles.map((role) => inlineColour(palette.light[role])),
  );

const unreached = unreachedColours(signatureTemplate.html);
if (unreached.length)
  throw new Error(
    `mail: The signature keeps its light colours in dark mode where it uses ${unreached.join(", ")}. Install a brand version within mail's peerDependencies range in package.json, or update the signature's colour mappings in the palette in components/theme.ts to use the current exported colour tokens if the installed version is in range.`,
  );
