export const attr = (html: string, tag: string, name: string) =>
  html.match(new RegExp(`<${tag}\\b[^>]*\\b${name}="([^"]*)"`))?.[1];

/** The style attribute of the first element of that tag, as a property map. */
export function style(html: string, tag: string): Record<string, string> {
  const raw = attr(html, tag, "style") ?? "";
  return Object.fromEntries(
    raw
      .split(";")
      .filter(Boolean)
      .map((d) => d.split(":").map((s) => s.trim()) as [string, string]),
  );
}
