import { Link, Text } from "react-email";
import { accentLink, paint } from "./MailShell";
import { BREAK, broken } from "./Paragraph";
import { palette } from "./theme";

export type ObjectionProps = {
  /** The words before the link, the link's own words and the words after it. */
  before: string;
  linkText: string;
  after: string;
  /** The prepared objection mail the link opens. */
  mailto: { to: string; subject?: string; body?: string };
};

export function mailtoHref({ to, subject, body }: ObjectionProps["mailto"]): string {
  const query = Object.entries({ subject, body })
    .filter(([, v]) => v)
    // RFC 6068 section 5: a line break in the body is encoded as %0D%0A.
    .map(([k, v]) => `${k}=${encodeURIComponent((v as string).split(BREAK).join("\r\n"))}`)
    .join("&");
  return `mailto:${to}${query ? `?${query}` : ""}`;
}

/** The note on the right to object (§ 7 (3) UWG) a mail to existing clients ends on. */
export function ObjectionNotice({ before, linkText, after, mailto }: ObjectionProps) {
  const { muted } = palette.light;
  return (
    <Text
      className={paint.text("muted")}
      style={{ fontSize: 12, lineHeight: "18px", color: muted, margin: "24px 0 0" }}
    >
      {broken(before)}
      <Link href={mailtoHref(mailto)} {...accentLink}>
        {broken(linkText)}
      </Link>
      {broken(after)}
    </Text>
  );
}

/** The notice in the text part: the link's words followed by the address, never the encoded query. */
export const objectionText = ({ before, linkText, after, mailto }: ObjectionProps) =>
  `${before}${linkText} (${mailto.to})${after}`;
