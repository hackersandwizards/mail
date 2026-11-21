import { test, unicodeString } from "@hackersandwizards/scaffolding/property";
import { expect } from "vitest";
import { DARK_MEDIA } from "../components/MailShell";
import { forceDark, forceInvert, forceLight } from "../scripts/frame-modes";

const escape = (text: string) => text.replaceAll("&", "&amp;").replaceAll("<", "&lt;");

test.prop([unicodeString, unicodeString], {
  examples: [
    ["", ""],
    ["@media (prefers-color-scheme: dark)", ""],
    ["標題", "背景".repeat(1024)],
    ["é </head> $&", "a/b?c=d"],
  ],
})(
  "frame modes change only the stylesheet switch and add the inversion filter inside the head",
  (title, body) => {
    const prefix = `<html><head><title>${escape(title)}</title><style>`;
    const rules = "{p{color:red}}";
    const headEnd = `${rules}</style>`;
    const tail = `</head><body>${escape(body)}</body></html>`;
    const html = prefix + DARK_MEDIA + headEnd + tail;
    expect(forceDark(html)).toBe(prefix + "@media all" + headEnd + tail);
    expect(forceLight(html)).toBe(prefix + "@media not all" + headEnd + tail);
    expect(forceInvert(html)).toBe(
      prefix +
        "@media not all" +
        headEnd +
        "<style>html,img{filter:invert(1) hue-rotate(180deg)}</style>" +
        tail,
    );
  },
);
