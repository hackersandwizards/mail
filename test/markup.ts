export const attr = (html: string, tag: string, name: string) =>
  html.match(new RegExp(`<${tag}\\b[^>]*\\b${name}="([^"]*)"`))?.[1];

export function style(html: string, tag: string): Record<string, string> {
  const raw = attr(html, tag, "style") ?? "";
  return Object.fromEntries(
    raw
      .split(";")
      .filter(Boolean)
      .map((d) => d.split(":").map((s) => s.trim()) as [string, string]),
  );
}
