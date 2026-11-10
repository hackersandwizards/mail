import { Item, itemText, type ItemProps } from "../components/Item";
import { MailShell } from "../components/MailShell";
import { ObjectionNotice, objectionText, type ObjectionProps } from "../components/ObjectionNotice";
import { Lines, Paragraph } from "../components/Paragraph";
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

/**
 * Refuses data that would render a wrong mail, naming the field: a missing or empty text (printed
 * as `undefined` or left blank), a language other than `de` or `en`, a link other than https, an
 * objection address carrying a query of its own. An image source may also be a relative path, which
 * only the catalog serves.
 */
export function checkBrief(data: unknown): asserts data is BriefProps {
  const fail = (path: string, why: string): never => {
    throw new Error(`${path} ${why}`);
  };
  const record = (value: unknown, path: string) =>
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : fail(path, "must be an object");
  const text = (value: unknown, path: string) =>
    typeof value === "string" && value.trim()
      ? value
      : fail(path, `must be a non-empty string, got ${JSON.stringify(value)}`);
  const list = (value: unknown, path: string, min: number) => {
    if (!Array.isArray(value) || value.length < min)
      fail(path, `must be a list of at least ${min} entries`);
    return value as unknown[];
  };
  const lines = (value: unknown, path: string, min = 0) =>
    list(value, path, min).forEach((line, i) => text(line, `${path}[${i}]`));
  const https = (value: unknown, path: string) => {
    if (!text(value, path).startsWith("https://")) fail(path, `must be an https URL, got ${value}`);
  };

  const p = record(data, "the data");
  if (p.lang !== "de" && p.lang !== "en") fail("lang", `must be "de" or "en", got ${p.lang}`);
  text(p.subject, "subject");
  if (text(p.preview, "preview").length > PREVIEW_MAX)
    fail("preview", `is longer than ${PREVIEW_MAX} characters, where the inbox line is cut`);
  text(p.greeting, "greeting");
  lines(p.intro, "intro");
  list(p.items, "items", 1).forEach((entry, i) => {
    const path = `items[${i}]`;
    const item = record(entry, path);
    for (const key of ["label", "title", "text"]) text(item[key], `${path}.${key}`);
    if (item.destination !== undefined) text(item.destination, `${path}.destination`);
    https(item.href, `${path}.href`);
    if (item.image === undefined) return;
    const image = record(item.image, `${path}.image`);
    if (/^[a-z][a-z\d+.-]*:/i.test(text(image.src, `${path}.image.src`)))
      https(image.src, `${path}.image.src`);
    text(image.alt, `${path}.image.alt`);
    if (image.href !== undefined) https(image.href, `${path}.image.href`);
  });
  lines(p.outro, "outro");
  lines(p.closing, "closing", 1);
  const signature = record(p.signature, "signature");
  text(signature.name, "signature.name");
  text(signature.role, "signature.role");
  if (signature.phone !== undefined) text(signature.phone, "signature.phone");
  if (signature.linkedin !== undefined) https(signature.linkedin, "signature.linkedin");
  const objection = record(p.objection, "objection");
  for (const key of ["before", "linkText", "after"]) text(objection[key], `objection.${key}`);
  const mailto = record(objection.mailto, "objection.mailto");
  if (!/^[^\s@?&#,]+@[^\s@?&#,]+$/.test(text(mailto.to, "objection.mailto.to")))
    fail("objection.mailto.to", `must be one plain address, got ${mailto.to}`);
  for (const key of ["subject", "body"])
    if (mailto[key] !== undefined) text(mailto[key], `objection.mailto.${key}`);
}

/**
 * The Brief: a personal mail with structure. Greeting, intro, labelled items, outro, sign-off, the
 * brand signature (the one wordmark) and the objection notice. No image unless an item brings one.
 */
export function Brief(p: BriefProps) {
  return (
    <MailShell lang={p.lang} title={p.subject} preview={p.preview}>
      <Paragraph>{p.greeting}</Paragraph>
      {p.intro.map((line, i) => (
        <Paragraph key={`intro-${i}`}>{line}</Paragraph>
      ))}
      {p.items.map((item, i) => (
        <Item key={`item-${i}`} {...item} />
      ))}
      {p.outro.map((line, i) => (
        <Paragraph key={`outro-${i}`}>{line}</Paragraph>
      ))}
      <Lines lines={p.closing} />
      <Signature {...p.signature} />
      <ObjectionNotice {...p.objection} />
    </MailShell>
  );
}

/** The Brief's text part, written by the engine rather than stripped from the HTML, in its order.
 * No `-- ` line: a program honouring it would treat the objection notice after the signature as
 * signature, and may grey it or drop it from a reply (RFC 3676 section 4.3). */
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
    ].join("\n\n") + "\n"
  );
}
