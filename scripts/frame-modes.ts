import { DARK_MEDIA } from "../components/MailShell";

const mediaInStylesheet = new RegExp(`(<style>[^<]*?)${RegExp.escape(DARK_MEDIA)}`);

function forceScheme(html: string, media: string): string {
  if (!mediaInStylesheet.test(html))
    throw new Error(
      `modes: Without ${DARK_MEDIA} in a style element, the catalog cannot switch the mail between light and dark. Restore the darkStyle stylesheet in components/MailShell.tsx.`,
    );
  return html.replace(mediaInStylesheet, `$1${media}`);
}

/** A frame takes its colour scheme from the page around it, so force the media rule there. */
export const forceDark = (html: string) => forceScheme(html, "@media all");
export const forceLight = (html: string) => forceScheme(html, "@media not all");

// Pictures keep their colours, as the forced modes leave them.
export const INVERT = "html,img{filter:invert(1) hue-rotate(180deg)}";

/** The inversion filter the forced dark modes come close to. */
export function forceInvert(html: string): string {
  const light = forceLight(html);
  if (!light.includes("</head>"))
    throw new Error(
      "modes: The catalog needs </head> to insert the inversion filter. Restore the Head wrapper in components/MailShell.tsx so it renders a closing tag.",
    );
  return light.replace("</head>", `<style>${INVERT}</style></head>`);
}
