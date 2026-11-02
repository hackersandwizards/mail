import type { ReactNode } from "react";
import { Body, Container, Head, Html, Preview } from "react-email";
import { fonts, palette, type Role } from "./theme";

const roles = Object.keys(palette.light) as Role[];

/** Class names that paint a role: text colour, background, border colour. */
export const paint = {
  text: (role: Role) => `hw-${role}`,
  bg: (role: Role) => `hw-bg-${role}`,
  border: (role: Role) => `hw-border-${role}`,
};

// The dark rules, once per role, for Apple Mail and other clients honouring prefers-color-scheme,
// and again under Outlook.com's data-ogsc/data-ogsb markers. React Email's Body repeats its
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
  `@media (prefers-color-scheme: dark){${darkRules("")}}` +
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
      <Preview>{preview}</Preview>
      <Body
        className={`hw-body ${paint.bg("page")}`}
        lang={lang}
        style={{ margin: 0, backgroundColor: palette.light.page }}
      >
        <Container
          style={{
            maxWidth: 600,
            padding: "24px",
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
