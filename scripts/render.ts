#!/usr/bin/env bun
/**
 * Renders a Brief mail from a data file to its HTML part and its plain-text part.
 *
 *   bun run mail-render <data.json> --out <path without extension>
 *
 * writes <out>.html and <out>.txt. Without --out it prints the HTML. The data file holds every word
 * of the mail (`BriefProps`); the engine adds none.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { createElement } from "react";
import { render } from "react-email";
import { Brief, briefText, checkBrief, type BriefProps } from "../mails/Brief";

export type RenderedMail = { html: string; text: string };

/** Both parts of a Brief; data `checkBrief` refuses throws, naming the field. */
export async function renderBrief(props: BriefProps): Promise<RenderedMail> {
  checkBrief(props);
  return { html: await render(createElement(Brief, props)), text: briefText(props) };
}

if (import.meta.main) {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: { out: { type: "string" } },
  });
  if (positionals.length !== 1) {
    console.error("mail-render: usage: mail-render <data.json> [--out <path without extension>]");
    process.exit(1);
  }
  const file = positionals[0];
  const mail = await renderBrief(JSON.parse(readFileSync(file, "utf-8"))).catch((e: Error) => {
    console.error(`mail-render: ${file}: ${e.message}`);
    process.exit(1);
  });
  if (!values.out) console.log(mail.html);
  else {
    writeFileSync(`${values.out}.html`, mail.html);
    writeFileSync(`${values.out}.txt`, mail.text);
    console.log(`${values.out}.html\n${values.out}.txt`);
  }
}
