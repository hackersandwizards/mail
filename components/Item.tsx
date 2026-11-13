import { Link, Text } from "react-email";
import { Image, type ImageProps } from "./Image";
import { accentLink, ITEM_INSET, ITEM_RULE, paint } from "./MailShell";
import { broken } from "./Paragraph";
import { label as labelType, labelText, palette } from "./theme";

export type ItemProps = {
  /** The kind of item, set in capitals: "Artikel", "Podcast", "Talk". */
  label: string;
  title: string;
  href: string;
  /** One or two sentences on what the reader gets. */
  text: string;
  /** Where the title leads and what it takes, set small and muted: "Video auf YouTube, 32 Min.". */
  destination?: string;
  image?: ImageProps;
};

/** An item in the text part, in the HTML part's order. */
export const itemText = ({ label, title, href, text, destination }: ItemProps) =>
  [`${labelText(label)}: ${title}`, href, destination, text].filter(Boolean).join("\n");

/** One labelled entry behind a rule in the accent: label, title as link, where the title leads,
 * short text. */
export function Item({ label, title, href, text, destination, image }: ItemProps) {
  const { accent, muted } = palette.light;
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      width="100%"
      style={{ marginBottom: 32 }}
    >
      <tbody>
        <tr>
          <td
            className={paint.border("accent")}
            style={{ borderLeft: `${ITEM_RULE}px solid ${accent}`, paddingLeft: ITEM_INSET }}
          >
            {image ? <Image {...image} href={image.href ?? href} /> : null}
            <Text
              className={paint.text("label")}
              style={{ ...labelType, color: palette.light.label, margin: "0 0 6px" }}
            >
              {broken(label)}
            </Text>
            <Text
              style={{
                fontSize: 18,
                lineHeight: "26px",
                fontWeight: "bold",
                margin: destination ? "0 0 2px" : "0 0 8px",
              }}
            >
              <Link href={href} {...accentLink}>
                {broken(title)}
              </Link>
            </Text>
            {destination ? (
              <Text
                className={paint.text("muted")}
                style={{ fontSize: 14, lineHeight: "20px", margin: "0 0 8px", color: muted }}
              >
                {broken(destination)}
              </Text>
            ) : null}
            <Text style={{ fontSize: 16, lineHeight: "24px", margin: 0 }}>{broken(text)}</Text>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
