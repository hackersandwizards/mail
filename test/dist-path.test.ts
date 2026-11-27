import { join } from "node:path";
import { describe, expect, test, vi } from "vitest";
import { resolveDistPath } from "../scripts/dist-path";

const dist = "/srv/dist";

describe("resolveDistPath", () => {
  test.each([
    ["plain path under the base", "http://127.0.0.1/mail/mails/brief.html", "mails/brief.html"],
    [
      "a filename beginning with two dots",
      "http://127.0.0.1/mail/..preview.html",
      "..preview.html",
    ],
    [
      "encoded ASCII escape",
      "http://127.0.0.1/mail/stories/Part%201/index.html",
      "stories/Part 1/index.html",
    ],
    [
      "2-byte UTF-8 escape",
      "http://127.0.0.1/mail/bilder/%C3%BCbersicht.png",
      "bilder/übersicht.png",
    ],
    ["3-byte UTF-8 boundary (U+0800)", "http://127.0.0.1/mail/%E0%A0%80.html", "\u0800.html"],
    ["3-byte UTF-8 pre-surrogate (U+D7FF)", "http://127.0.0.1/mail/%ED%9F%BF.html", "\uD7FF.html"],
    ["3-byte UTF-8 post-surrogate (U+E000)", "http://127.0.0.1/mail/%EE%80%80.html", "\uE000.html"],
    [
      "4-byte UTF-8 boundary (U+10000)",
      "http://127.0.0.1/mail/%F0%90%80%80.html",
      "\u{10000}.html",
    ],
    [
      "4-byte UTF-8 mid-range (U+40000)",
      "http://127.0.0.1/mail/%F1%80%80%80.html",
      "\u{40000}.html",
    ],
    ["4-byte UTF-8 max (U+10FFFF)", "http://127.0.0.1/mail/%F4%8F%BF%BF.html", "\u{10FFFF}.html"],
  ])("resolves %s inside dist", (_, url, expected) => {
    expect(resolveDistPath(url, dist)).toBe(join(dist, expected));
  });

  test.each([
    ["an unparseable URL", "not a url"],
    ["a path outside the base", "http://127.0.0.1/other/index.html"],
    ["a non-hex percent escape", "http://127.0.0.1/mail/%ZZ"],
    ["a truncated percent escape", "http://127.0.0.1/mail/%2"],
    ["a stray continuation byte", "http://127.0.0.1/mail/%80"],
    ["an invalid lead byte", "http://127.0.0.1/mail/%FF"],
    ["an overlong 2-byte sequence", "http://127.0.0.1/mail/%C0%AF"],
    ["an overlong 3-byte sequence", "http://127.0.0.1/mail/%E0%80%AF"],
    ["a UTF-16 surrogate sequence", "http://127.0.0.1/mail/%ED%A0%80"],
    ["an overlong 4-byte sequence", "http://127.0.0.1/mail/%F0%80%80%AF"],
    ["a code point above U+10FFFF", "http://127.0.0.1/mail/%F4%90%80%80"],
    ["an encoded traversal out of dist", "http://127.0.0.1/mail/%2e%2e/package.json"],
  ])("returns null for %s", (_, url) => {
    expect(resolveDistPath(url, dist)).toBeNull();
  });

  test("propagates an unexpected error from decodeURIComponent", () => {
    const spy = vi.spyOn(globalThis, "decodeURIComponent").mockImplementationOnce(() => {
      throw new Error("unexpected decoder failure");
    });
    try {
      expect(() => resolveDistPath("http://127.0.0.1/mail/index.html", dist)).toThrow(
        "unexpected decoder failure",
      );
    } finally {
      spy.mockRestore();
    }
  });
});
