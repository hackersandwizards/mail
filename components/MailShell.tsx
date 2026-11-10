import type { ReactNode } from "react";
import { Body, Container, Head, Html, Preview } from "react-email";
import { fonts, palette, roles, type Role } from "./theme";

/** The column's width on a desktop, and the narrowest phone a mail is drawn for: 360 x 800 held
 * 9 % of phone screens worldwide in StatCounter's figures for August 2026. */
export const COLUMN_WIDTH = 600;
export const PHONE_WIDTH = 360;
/** The page's inset around the column, each side. */
export const PAGE_INSET = 24;

/** The media query the mail's dark rules sit under. */
export const DARK_MEDIA = "@media (prefers-color-scheme: dark)";

/** Class names that paint a role: text colour, background, border colour. */
export const paint = {
  text: (role: Role) => `hw-${role}`,
  bg: (role: Role) => `hw-bg-${role}`,
  border: (role: Role) => `hw-border-${role}`,
};

/** A link in the accent, underlined: spread onto React Email's `Link`. The longhand overrides the
 * `text-decoration-line: none` that `Link` sets, so the underline holds where a client drops the
 * shorthand. */
export const accentLink = {
  className: paint.text("accent"),
  style: {
    color: palette.light.accent,
    textDecoration: "underline",
    textDecorationLine: "underline",
  },
} as const;

// The dark rules, once per role, for Apple Mail and other clients honouring prefers-color-scheme,
// and again under Outlook.com's data-ogsc marker. React Email's Body repeats its
// background on an inner cell without a class, so the page rule names that cell too. The brand
// signature carries its colours inline, so it is reached by those values.
function darkRules(prefix: string): string {
  const d = palette.dark;
  const rules = roles.flatMap((r) => [
    `${prefix}.${paint.text(r)}{color:${d[r]}!important}`,
    `${prefix}.${paint.bg(r)}{background-color:${d[r]}!important}`,
    `${prefix}.${paint.border(r)}{border-color:${d[r]}!important}`,
  ]);
  rules.push(`${prefix}.hw-body>table>tbody>tr>td{background-color:${d.page}!important}`);
  for (const r of roles) {
    rules.push(`${prefix}.hw-sig [style*="color: ${palette.light[r]}"]{color:${d[r]}!important}`);
  }
  return rules.join("");
}

export const darkStyle =
  `:root{color-scheme:light dark;supported-color-schemes:light dark}` +
  `${DARK_MEDIA}{${darkRules("")}}` +
  darkRules("[data-ogsc] ");

export type MailShellProps = {
  /** BCP 47 language of the mail, `de` or `en`. */
  lang: string;
  /** The mail's subject, its document title. */
  title: string;
  /** The preview line an inbox shows after the subject. */
  preview: string;
  children: ReactNode;
};

/** The frame every mail sits in: head with colour schemes and dark styles, white page, 600 px column. */
export function MailShell({ lang, title, preview, children }: MailShellProps) {
  return (
    <Html lang={lang} dir="ltr">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <title>{title}</title>
        <style>{darkStyle}</style>
      </Head>
      {/* The subject is the one title; the preview stays the hidden line only. */}
      <Preview useTitleTag={false}>{preview}</Preview>
      <Body
        className={`hw-body ${paint.bg("page")}`}
        lang={lang}
        style={{ margin: 0, backgroundColor: palette.light.page }}
      >
        <Container
          style={{
            maxWidth: COLUMN_WIDTH,
            padding: PAGE_INSET,
            fontFamily: fonts.sans,
            color: palette.light.ink,
          }}
          className={paint.text("ink")}
        >
          {children}
        </Container>
      </Body>
    </Html>
  );
}
