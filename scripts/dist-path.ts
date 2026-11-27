import { isAbsolute, join, relative, sep } from "node:path";

// The catalog's base, set in catalog/astro.config.ts.
export const BASE = "/mail/";

const UTF8_CONT = "(?:%[89AB][0-9A-F])";
// Well-formed RFC 3629 UTF-8 percent-escapes, matching what decodeURIComponent accepts.
const VALID_PERCENT_UTF8 = new RegExp(
  "^(?:[^%]|" +
    "%[0-7][0-9A-F]|" +
    `%(?:C[2-9A-F]|D[0-9A-F])${UTF8_CONT}|` +
    `%E0%[AB][0-9A-F]${UTF8_CONT}|` +
    `%E[1-9A-CEF]${UTF8_CONT}{2}|` +
    `%ED%[89][0-9A-F]${UTF8_CONT}|` +
    `%F0%[9AB][0-9A-F]${UTF8_CONT}{2}|` +
    `%F[1-3]${UTF8_CONT}{3}|` +
    `%F4%8[0-9A-F]${UTF8_CONT}{2}` +
    ")*$",
  "i",
);

/** Decoded file path under `dist` for a request URL, or `null` when malformed or outside `dist`. */
export function resolveDistPath(reqUrl: string, dist: string): string | null {
  const parsed = URL.parse(reqUrl);
  if (!parsed || !VALID_PERCENT_UTF8.test(parsed.pathname)) return null;
  const path = decodeURIComponent(parsed.pathname);
  if (!path.startsWith(BASE)) return null;
  const file = join(dist, path.slice(BASE.length));
  const fromDist = relative(dist, file);
  if (fromDist === ".." || fromDist.startsWith(`..${sep}`) || isAbsolute(fromDist)) return null;
  return file;
}
