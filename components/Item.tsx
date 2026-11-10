import { Link, Text } from "react-email";
import { Image, type ImageProps } from "./Image";
import { accentLink, paint } from "./MailShell";
import { label as labelType, labelText, palette } from "./theme";

export type ItemProps = {
  /** The kind of item, set in capitals: "Artikel", "Podcast", "Talk". */
  label: string;
  title: string;
  href: string;
  /** One or two sentences on what the reader gets. */
  text: string;
  image?: ImageProps;
};

/** An item in the text part: label, title, address, text. */
export const itemText = ({ label, title, href, text }: ItemProps) =>
  `${labelText(label)}: ${title}\n${href}\n${text}`;

/** One labelled entry behind a rule in the accent: label, title as link, short text. */
export function Item({ label, title, href, text, image }: ItemProps) {
  const { accent } = palette.light;
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      width="100%"
      style={{ marginBottom: 20 }}
    >
      <tbody>
        <tr>
          <td
            className={paint.border("accent")}
            style={{ borderLeft: `3px solid ${accent}`, paddingLeft: 14 }}
          >
            {image ? <Image {...image} href={image.href ?? href} /> : null}
            <Text
              className={paint.text("label")}
              style={{ ...labelType, color: palette.light.label, margin: "0 0 4px" }}
            >
              {label}
            </Text>
            <Text
              style={{ fontSize: 18, lineHeight: "26px", fontWeight: "bold", margin: "0 0 4px" }}
            >
              <Link href={href} {...accentLink}>
                {title}
              </Link>
            </Text>
            <Text style={{ fontSize: 16, lineHeight: "24px", margin: 0 }}>{text}</Text>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
