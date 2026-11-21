import { DARK_MEDIA } from "../components/MailShell";

const mediaInStylesheet = new RegExp(`(<style>[^<]*?)${RegExp.escape(DARK_MEDIA)}`);

function forceScheme(html: string, media: string): string {
  if (!mediaInStylesheet.test(html)) throw new Error(`modes: the mail holds no ${DARK_MEDIA}`);
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
  if (!light.includes("</head>")) throw new Error("modes: the mail holds no </head>");
  return light.replace("</head>", `<style>${INVERT}</style></head>`);
}
