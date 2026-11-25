import { MAX_IMAGE_WIDTH } from "../components/Image";
import { Item, itemText, type ItemProps } from "../components/Item";
import { MailShell } from "../components/MailShell";
import { ObjectionNotice, objectionText, type ObjectionProps } from "../components/ObjectionNotice";
import { BREAK, broken, Lines, Paragraph } from "../components/Paragraph";
import { Signature, signatureText, type SignatureFields } from "../components/Signature";

/** Every word of a Brief mail; the engine adds none of its own. */
export type BriefProps = {
  lang: "de" | "en";
  subject: string;
  preview: string;
  greeting: string;
  intro: string[];
  items: ItemProps[];
  outro: string[];
  /** The sign-off lines, e.g. a greeting and the sender's short name. */
  closing: string[];
  signature: SignatureFields;
  objection: ObjectionProps;
};

/** React Email's `Preview` cuts the preview line here, mid-word. */
const PREVIEW_MAX = 200;

const invalidBriefField = (path: string, why: string): never => {
  throw new Error(`${path} ${why}`);
};
const briefFields = (value: unknown, path: string, keys: string[]) => {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    invalidBriefField(path, "must be an object");
  const fields = value as Record<string, unknown>;
  for (const key of Object.keys(fields))
    if (!keys.includes(key))
      invalidBriefField(`${path}.${key}`, `is no field; the fields are ${keys.join(", ")}`);
  return fields;
};
const briefFieldText = (value: unknown, path: string) =>
  typeof value === "string" && value.trim()
    ? value
    : invalidBriefField(path, `must be a non-empty string, got ${JSON.stringify(value)}`);
function* briefListEntries(value: unknown, path: string, min: number) {
  if (!Array.isArray(value) || value.length < min)
    return invalidBriefField(path, `must be a list of at least ${min} entries`);
  for (let index = 0; index < value.length; index++)
    yield [index, value[index] as unknown] as const;
  // The plain-text part also spreads the intro and outro, which can use a custom iterator.
  if (value[Symbol.iterator] !== Array.prototype.values)
    yield* Array.from<unknown>(value).entries();
}

function checkBriefLines(value: unknown, path: string, min = 0) {
  for (const [index, line] of briefListEntries(value, path, min))
    briefFieldText(line, `${path}[${index}]`);
}

const briefSingleLine = (value: unknown, path: string) => {
  if (BREAK.test(briefFieldText(value, path))) invalidBriefField(path, "must be one line");
};
// A URL parser drops or encodes whitespace, control and format characters and reads a backslash
// as a slash; it also maps a full-width letter in the host, so a link or address that NFKC changes
// is not the one the mail prints.
const unsafeBriefLink = /[\s\p{Cc}\p{Cf}\\]/u;
const isPlainBriefLink = (value: string) =>
  !unsafeBriefLink.test(value) && value.normalize("NFKC") === value;
const briefHttps = (value: unknown, path: string, want = "an https URL") => {
  const url = briefFieldText(value, path);
  if (!url.startsWith("https://") || !isPlainBriefLink(url) || !URL.parse(url))
    invalidBriefField(path, `must be ${want}, got ${JSON.stringify(url)}`);
};
const briefPixels = (value: unknown, path: string) =>
  Number.isInteger(value) && (value as number) > 0
    ? (value as number)
    : invalidBriefField(path, `must be a whole number of pixels above 0, got ${value}`);

function checkBriefImage(value: unknown, path: string) {
  const image = briefFields(value, path, ["src", "alt", "width", "height", "href"]);
  const src = briefFieldText(image.src, `${path}.src`);
  // Only a plain path is relative: a colon, a leading `//` or an unsafe character can name
  // another scheme or host.
  if (unsafeBriefLink.test(src) || /:|^\/\//.test(src))
    briefHttps(src, `${path}.src`, "an https URL or a plain relative path");
  briefFieldText(image.alt, `${path}.alt`);
  if (briefPixels(image.width, `${path}.width`) > MAX_IMAGE_WIDTH)
    invalidBriefField(
      `${path}.width`,
      `is wider than the ${MAX_IMAGE_WIDTH} px the phone column holds`,
    );
  briefPixels(image.height, `${path}.height`);
  if (image.href !== undefined) briefHttps(image.href, `${path}.href`);
}

function checkBriefItem(value: unknown, path: string) {
  const item = briefFields(value, path, ["label", "title", "href", "text", "destination", "image"]);
  for (const key of ["label", "title", "text"]) briefFieldText(item[key], `${path}.${key}`);
  if (item.destination !== undefined) briefFieldText(item.destination, `${path}.destination`);
  briefHttps(item.href, `${path}.href`);
  if (item.image !== undefined) checkBriefImage(item.image, `${path}.image`);
}

function checkBriefSignature(value: unknown, path: string) {
  const signature = briefFields(value, path, ["name", "role", "phone", "linkedin"]);
  // The brand's signature template folds a line break the text part keeps.
  briefSingleLine(signature.name, `${path}.name`);
  briefSingleLine(signature.role, `${path}.role`);
  if (signature.phone !== undefined) briefSingleLine(signature.phone, `${path}.phone`);
  if (signature.linkedin !== undefined) briefHttps(signature.linkedin, `${path}.linkedin`);
}

function checkBriefMailto(value: unknown, path: string) {
  const mailto = briefFields(value, path, ["to", "subject", "body"]);
  const to = briefFieldText(mailto.to, `${path}.to`);
  if (!isPlainBriefLink(to) || !/^[^@?&#,%;<>"/]+@[^@?&#,%;<>"/]+$/.test(to))
    invalidBriefField(`${path}.to`, `must be one plain address, got ${JSON.stringify(to)}`);
  if (mailto.subject !== undefined) briefSingleLine(mailto.subject, `${path}.subject`);
  if (mailto.body !== undefined) briefFieldText(mailto.body, `${path}.body`);
}

function checkBriefObjection(value: unknown, path: string) {
  const objection = briefFields(value, path, ["before", "linkText", "after", "mailto"]);
  for (const key of ["before", "linkText", "after"])
    briefFieldText(objection[key], `${path}.${key}`);
  checkBriefMailto(objection.mailto, `${path}.mailto`);
}

/**
 * Refuses data that would render a wrong mail, naming the field: a missing, empty or unknown field
 * (printed as `undefined`, left blank or silently dropped), a language other than `de` or `en`, a
 * link other than https, an image size that is no whole pixel or wider than the phone column, an
 * objection address carrying a query or an escape of its own, or a subject, objection subject or
 * signature field spanning lines. A line break inside any other field the mail prints reads the same
 * in both parts. An image source may also be a path relative to the mail, which only the catalog
 * serves.
 */
export function checkBrief(data: unknown): asserts data is BriefProps {
  const p = briefFields(data, "the data", [
    "lang",
    "subject",
    "preview",
    "greeting",
    "intro",
    "items",
    "outro",
    "closing",
    "signature",
    "objection",
  ]);
  if (p.lang !== "de" && p.lang !== "en")
    invalidBriefField("lang", `must be "de" or "en", got ${p.lang}`);
  briefSingleLine(p.subject, "subject");
  if (briefFieldText(p.preview, "preview").length > PREVIEW_MAX)
    invalidBriefField(
      "preview",
      `is longer than ${PREVIEW_MAX} characters, where the inbox line is cut`,
    );
  briefFieldText(p.greeting, "greeting");
  checkBriefLines(p.intro, "intro");
  for (const [index, item] of briefListEntries(p.items, "items", 1))
    checkBriefItem(item, `items[${index}]`);
  checkBriefLines(p.outro, "outro");
  checkBriefLines(p.closing, "closing", 1);
  checkBriefSignature(p.signature, "signature");
  checkBriefObjection(p.objection, "objection");
}

/**
 * The Brief: a personal mail with structure. Greeting, intro, labelled items, outro, sign-off, the
 * brand signature (the one wordmark) and the objection notice. No image unless an item brings one.
 */
export function Brief(p: BriefProps) {
  return (
    <MailShell lang={p.lang} title={p.subject} preview={p.preview}>
      <Paragraph>{broken(p.greeting)}</Paragraph>
      {p.intro.map((line, i) => (
        <Paragraph key={`intro-${i}`}>{broken(line)}</Paragraph>
      ))}
      {p.items.map((item, i) => (
        <Item key={`item-${i}`} {...item} />
      ))}
      {p.outro.map((line, i) => (
        <Paragraph key={`outro-${i}`}>{broken(line)}</Paragraph>
      ))}
      <Lines lines={p.closing} />
      <Signature {...p.signature} />
      <ObjectionNotice {...p.objection} />
    </MailShell>
  );
}

/** The Brief's text part, written by the engine rather than stripped from the HTML, in its order,
 * each line break where the HTML part sets a `<br>`. No `-- ` line: a program honouring it would
 * treat the objection notice after the signature as signature, and may grey it or drop it from a
 * reply (RFC 3676 section 4.3). */
export function briefText(p: BriefProps): string {
  return (
    [
      p.greeting,
      ...p.intro,
      ...p.items.map(itemText),
      ...p.outro,
      p.closing.join("\n"),
      signatureText(p.signature).trim(),
      objectionText(p.objection),
    ]
      .join("\n\n")
      .split(BREAK)
      .join("\n") + "\n"
  );
}
