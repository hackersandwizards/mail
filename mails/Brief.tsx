import { Item, type ItemProps } from "../components/Item";
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

/** The Brief's text part, written by the engine rather than stripped from the HTML. */
export function briefText(p: BriefProps): string {
  const items = p.items.map((i) => `${i.label.toUpperCase()}: ${i.title}\n${i.href}\n${i.text}`);
  return (
    [
      p.greeting,
      ...p.intro,
      ...items,
      ...p.outro,
      p.closing.join("\n"),
      `-- \n${signatureText(p.signature).trim()}`,
      objectionText(p.objection),
    ].join("\n\n") + "\n"
  );
}
