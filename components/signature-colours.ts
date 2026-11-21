/** Each colour of a signature template that no dark rule reaches: the dark rules repaint only an
 * inline text colour of a role, so any other colour in a style attribute, a style element or a
 * colour attribute stays light in dark mode. A colour given by name is seen only in `color`, `fill`,
 * `stroke`, a `-color` longhand, a background or an attribute. */
export const findUnreachedColours = (html: string, darkDeclarations: readonly string[]) => {
  const paints = (d: string) =>
    /^(?:color|fill|stroke|[\w-]*-color)\s*:/i.test(d) ||
    /#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i.test(d) ||
    (/^background(?:-image)?\s*:/i.test(d) && !/:\s*(?:none|transparent)$/i.test(d));
  const declarations = (css: string) =>
    css
      .replace(/\/\*.*?\*\//gs, "")
      .split(";")
      .map((d) => d.trim());
  const styleElements: string[] = [];
  const inlineStyles: string[] = [];
  const colourAttributes: string[] = [];
  const tags =
    /<!--.*?-->|<style(?=[\s>])(?:[^"'<>]|"[^"]*"|'[^']*')*>(.*?)<\/style\s*>|<[a-z][\w:-]*(?=[\s/>])((?:[^"'<>]|"[^"]*"|'[^']*')*)>/gis;
  for (const [, stylesheet, attributes] of html.matchAll(tags)) {
    if (stylesheet !== undefined) {
      for (const [, rules] of stylesheet.matchAll(/\{([^{}]*)\}/g)) {
        styleElements.push(...declarations(rules).filter(paints));
      }
    }
    if (attributes === undefined) continue;
    const assignments = /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g;
    for (const [assignment, name, doubleQuoted, singleQuoted, bare] of attributes.matchAll(
      assignments,
    )) {
      const value = doubleQuoted ?? singleQuoted ?? bare;
      const lower = name.toLowerCase();
      if (lower === "style") {
        inlineStyles.push(
          ...declarations(value).filter((d) => paints(d) && !darkDeclarations.includes(d)),
        );
      } else if (["bgcolor", "color", "fill", "stroke"].includes(lower)) {
        colourAttributes.push(assignment.replace(/["']$/, ""));
      }
    }
  }
  return [...styleElements, ...inlineStyles, ...colourAttributes];
};
