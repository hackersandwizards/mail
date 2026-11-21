import { fc, test, unicodeString } from "@hackersandwizards/scaffolding/property";
import { expect } from "vitest";
import data from "../catalog/mails/brief-bild.json";
import { MAX_IMAGE_WIDTH } from "../components/Image";
import { checkBrief } from "../mails/Brief";
import { parseBrief } from "../scripts/render";

const line = unicodeString.map((text) => `A${text.replace(/[\n\r\v\f\u0085\u2028\u2029]/g, " ")}`);
const prototypeKeys = ["constructor", "__proto__", "toString"] as const;
const unknownKey = fc.oneof(
  fc.constantFrom(...prototypeKeys),
  unicodeString.map((text) => `_${text}`),
);
const separators = ["\r\n", "\n", "\r", "\v", "\f", "\u0085", "\u2028", "\u2029"] as const;

test.prop([line, fc.array(line, { maxLength: 8 }), fc.constantFrom("de", "en")], {
  examples: [
    ["Überblick", [], "de"],
    ["題".repeat(1024), ["a/b ?#&"], "en"],
  ],
})("parsing a valid serialized Brief preserves its data", (subject, intro, lang) => {
  const brief = { ...data, subject, intro, lang };
  expect(parseBrief(JSON.stringify(brief))).toEqual(brief);
});

test.prop(
  [unknownKey, fc.constantFrom("root", "signature", "item", "image", "objection", "mailto")],
  {
    examples: [
      ["constructor", "root"],
      ["__proto__", "signature"],
      ["toString", "item"],
      ["", "mailto"],
      ["未知".repeat(512), "objection"],
    ],
  },
)("an unknown own key at any record level is rejected by name", (key, level) => {
  const brief = structuredClone(data);
  const nodes = {
    root: [brief, "the data"],
    signature: [brief.signature, "signature"],
    item: [brief.items[0], "items[0]"],
    image: [brief.items[0].image, "items[0].image"],
    objection: [brief.objection, "objection"],
    mailto: [brief.objection.mailto, "objection.mailto"],
  } as const;
  const [record, path] = nodes[level];
  Object.defineProperty(record, key, { enumerable: true, value: true });
  expect(() => parseBrief(JSON.stringify(brief))).toThrow(`${path}.${key} is no field`);
});

test.prop([fc.array(line, { maxLength: 8 }), fc.constantFrom("intro", "outro", "closing")], {
  examples: [
    [[], "intro"],
    [["語"], "outro"],
    [[], "closing"],
  ],
})("Brief lists reject a missing entry at its index", (lines, field) => {
  const index = lines.length;
  const sparse = [...lines];
  sparse.length += 1;
  expect(() => checkBrief({ ...data, [field]: sparse })).toThrow(
    `${field}[${index}] must be a non-empty string`,
  );
  const items = lines.map(() => data.items[0]);
  items.length += 1;
  expect(() => checkBrief({ ...data, items })).toThrow(`items[${index}] must be an object`);
});

test.prop([fc.integer({ min: 0, max: 1024 }), fc.constantFrom("x", "é", "🙂")], {
  examples: [
    [0, "x"],
    [1, "x"],
    [99, "🙂"],
    [100, "🙂"],
    [101, "🙂"],
    [200, "é"],
    [201, "é"],
    [1024, "x"],
  ],
})(
  "preview accepts exactly one through 200 UTF-16 code units for nonblank text",
  (length, unit) => {
    const preview = unit.repeat(length);
    const check = () => checkBrief({ ...data, preview });
    if (preview.length === 0) {
      expect(check).toThrow("preview must be a non-empty string");
    } else if (preview.length > 200) {
      expect(check).toThrow("preview is longer than 200 characters");
    } else {
      expect(check).not.toThrow();
    }
  },
);

test.prop([line, fc.constantFrom(...separators), line], {
  examples: separators.map(
    (separator) => ["Subject", separator, "Trailer"] satisfies [string, string, string],
  ),
})("headers and signature fields reject every line separator", (before, separator, after) => {
  const value = before + separator + after;
  expect(() => checkBrief({ ...data, subject: value })).toThrow("subject must be one line");
  for (const field of ["name", "role", "phone"]) {
    expect(() => checkBrief({ ...data, signature: { ...data.signature, [field]: value } })).toThrow(
      `signature.${field} must be one line`,
    );
  }
  const objection = { ...data.objection, mailto: { ...data.objection.mailto, subject: value } };
  expect(() => checkBrief({ ...data, objection })).toThrow(
    "objection.mailto.subject must be one line",
  );
});

test.prop([fc.oneof(fc.integer({ min: -512, max: 1024 }), fc.double(), unicodeString)], {
  examples: [[0], [1], [MAX_IMAGE_WIDTH], [MAX_IMAGE_WIDTH + 1], [1.5], ["1"], [NaN], [Infinity]],
})(
  "image width is a positive whole pixel count within the phone column and height has no column cap",
  (size) => {
    const check = (dimension: "width" | "height") => () =>
      checkBrief({
        ...data,
        items: [{ ...data.items[0], image: { ...data.items[0].image, [dimension]: size } }],
      });
    if (typeof size !== "number" || !Number.isInteger(size) || size <= 0) {
      expect(check("width")).toThrow("items[0].image.width must be a whole number");
      expect(check("height")).toThrow("items[0].image.height must be a whole number");
    } else {
      expect(check("height")).not.toThrow();
      if (size > MAX_IMAGE_WIDTH) expect(check("width")).toThrow("items[0].image.width is wider");
      else expect(check("width")).not.toThrow();
    }
  },
);

test.prop([unicodeString, fc.constantFrom(" ", "\t", "\r", "\u0001", "\u200b", "\\", "ｅ")], {
  examples: [
    ["", " "],
    ["a/b?c=d", "\\"],
    ["語".repeat(1024), "\u200b"],
    ["é", "ｅ"],
    ["x", "\u0001"],
    ["x", "\t"],
    ["x", "\r"],
  ],
})(
  "https links accept encoded paths and refuse characters the URL parser would reinterpret",
  (suffix, unsafe) => {
    const path = encodeURIComponent(suffix);
    const href = `https://example.com/${path}`;
    const item = data.items[0];
    const malformed = `https://exam${unsafe}ple.com/${path}`;
    expect(() =>
      checkBrief({
        ...data,
        items: [{ ...item, href, image: { ...item.image, href } }],
      }),
    ).not.toThrow();
    expect(() => checkBrief({ ...data, items: [{ ...item, href: malformed }] })).toThrow(
      "items[0].href must be an https URL",
    );
  },
);

const addressSeparators = [
  "@",
  "?",
  "&",
  "#",
  ",",
  "%",
  ";",
  "<",
  ">",
  '"',
  "/",
  "\\",
  "\u0001",
  "\u200b",
  "ｅ",
] as const;
test.prop([unicodeString, fc.constantFrom(...addressSeparators)], {
  examples: [
    ...addressSeparators.map((separator) => ["", separator] satisfies [string, string]),
    ["É".repeat(1024), "?"],
  ],
})("an objection address rejects additional address and query separators", (local, separator) => {
  const safeLocal = local
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .normalize("NFKC");
  const check = (to: string) => () =>
    checkBrief({ ...data, objection: { ...data.objection, mailto: { to } } });
  expect(check(`mail${safeLocal}@example.com`)).not.toThrow();
  expect(check(`mail${safeLocal}${separator}@example.com`)).toThrow(
    "objection.mailto.to must be one plain address",
  );
  expect(check(`mail${safeLocal}@exam${separator}ple.com`)).toThrow(
    "objection.mailto.to must be one plain address",
  );
});
