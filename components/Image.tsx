import { Img } from "react-email";
import { paint } from "./MailShell";
import { corner, fonts, palette } from "./theme";

// React types carry no bgcolor; the attribute is what classic Outlook paints a cell from.
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- must repeat React's parameter
  interface TdHTMLAttributes<T> {
    bgcolor?: string;
  }
}

export type ImageProps = {
  /** An https URL the client loads; never an attachment. */
  src: string;
  /** Short words standing in for the picture while images are blocked. */
  alt: string;
  /** Display size in whole CSS pixels. */
  width: number;
  height: number;
  href?: string;
};

/** The widest image the narrowest column holds: a 360 px phone less the page's insets (2 x 24) and
 * the item's rule and inset (3 + 14). `test/modes.test.ts` draws one this wide at that width. */
export const MAX_IMAGE_WIDTH = 295;

/**
 * An image that keeps its box while the client blocks images: whole-pixel width and height in the
 * attributes and the style (a `height:auto` would collapse the box), the tint behind the image and
 * its cell, and the alt text set small, muted and without the link underline it would inherit.
 * Classic Outlook on Windows shows its own notice instead of styled alt text. Image and cell take
 * the small corner, which classic Outlook leaves square; it trims content touching a corner.
 */
export function Image({ src, alt, width, height, href }: ImageProps) {
  for (const [name, value] of Object.entries({ width, height })) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`mail Image: ${name} must be a whole number of pixels above 0, got ${value}`);
    }
  }
  if (width > MAX_IMAGE_WIDTH) {
    throw new Error(
      `mail Image: ${src} is ${width} px wide, the phone column holds ${MAX_IMAGE_WIDTH}`,
    );
  }
  if (!alt.trim()) throw new Error(`mail Image: ${src} has no alt text`);
  const { tint, muted } = palette.light;
  // The box image and cell share, so it holds while the image is blocked.
  const box = {
    width: `${width}px`,
    height: `${height}px`,
    borderRadius: corner,
    backgroundColor: tint,
  };
  const img = (
    <Img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`${paint.bg("tint")} ${paint.text("muted")}`}
      style={{
        ...box,
        fontFamily: fonts.sans,
        fontSize: "12px",
        lineHeight: "16px",
        color: muted,
      }}
    />
  );
  return (
    <table
      role="presentation"
      cellPadding={0}
      cellSpacing={0}
      border={0}
      style={{ marginBottom: 12 }}
    >
      <tbody>
        <tr>
          <td width={width} height={height} bgcolor={tint} className={paint.bg("tint")} style={box}>
            {href ? (
              <a
                href={href}
                className={paint.text("muted")}
                style={{ color: muted, textDecoration: "none" }}
              >
                {img}
              </a>
            ) : (
              img
            )}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
