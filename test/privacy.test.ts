// The repo is public: the catalog mails carry brand's invented person, invented first names and
// example addresses only.
import { expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { EXAMPLE } from "@hackersandwizards/brand/mail-signature/fill.ts";

const dir = join(import.meta.dir, "..", "catalog", "mails");
const ALLOWED_HOSTS = ["example.com", "www.hackersandwizards.dev", "www.linkedin.com"];
const INVENTED_FIRST_NAMES = ["Robin"];

/** Every place a data file names a host, an address, a phone number or a person that is not invented. */
function leaks(raw: string): string[] {
  const data = JSON.parse(raw);
  const found: string[] = [];
  // Addresses and hosts in any script, with or without a scheme; a path segment after a slash and
  // an address's local part are no host, so a relative image path passes.
  for (const [, host] of raw.matchAll(/[\p{L}\d._%+-]+@([\p{L}\d.-]+\.\p{L}{2,})/gu))
    if (host !== "example.com") found.push(`address at ${host}`);
  for (const [, host] of raw.matchAll(/\/\/([^/\s"?#]+)/g))
    if (!ALLOWED_HOSTS.includes(host)) found.push(`host ${host}`);
  for (const [host] of raw.matchAll(
    /(?<![\p{L}\d/@.-])(?:[\p{L}\d-]+\.)+\p{L}{2,}(?![\p{L}\d@-])/gu,
  ))
    if (!ALLOWED_HOSTS.includes(host)) found.push(`host ${host}`);
  for (const [number] of raw.matchAll(/\+?\d[\d /-]{6,}\d/g))
    if (number !== EXAMPLE.phone) found.push(`number ${number}`);
  const { name, phone, linkedin } = data.signature ?? {};
  if (name !== EXAMPLE.name) found.push(`signature ${name}`);
  if (phone !== undefined && phone !== EXAMPLE.phone) found.push(`phone ${phone}`);
  if (linkedin !== undefined && linkedin !== EXAMPLE.linkedin) found.push(`linkedin ${linkedin}`);
  const first = /(\p{L}+),?\s*$/u.exec(data.greeting ?? "")?.[1];
  if (!first || !INVENTED_FIRST_NAMES.includes(first)) found.push(`greeting ${data.greeting}`);
  return found;
}

test.each(readdirSync(dir).filter((f) => f.endsWith(".json")))("%s is invented", (file) => {
  expect(leaks(readFileSync(join(dir, file), "utf-8"))).toEqual([]);
});

test("a data file with real data is caught at every leak", () => {
  const real = {
    greeting: "Moin Annegret,",
    intro: ["Preise: www.kunde.de/preise, Bild: //cdn.kunde.de/karte.png, Mail: kim@müller.de"],
    signature: {
      name: "Kim Beispiel",
      phone: "+49 171 2345678",
      linkedin: "https://www.linkedin.com/in/annegret-real",
    },
  };
  expect(leaks(JSON.stringify(real))).toEqual([
    "address at müller.de",
    "host cdn.kunde.de",
    "host www.kunde.de",
    "number +49 171 2345678",
    "phone +49 171 2345678",
    "linkedin https://www.linkedin.com/in/annegret-real",
    "greeting Moin Annegret,",
  ]);
});
