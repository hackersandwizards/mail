import { expect, test } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { EXAMPLE } from "@hackersandwizards/brand/mail-signature/fill.ts";

const dir = fileURLToPath(new URL("../catalog/mails", import.meta.url));
const ALLOWED_HOSTS = ["example.com", "www.hackersandwizards.dev", "www.linkedin.com"];
const INVENTED_FIRST_NAMES = ["Robin"];

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

function addressLeaks(raw: string): string[] {
  const found: string[] = [];
  for (const [, host] of raw.matchAll(/[\p{L}\d._%+-]+@([\p{L}\d.-]+\.\p{L}{2,})/gu))
    if (host !== "example.com") found.push(`address at ${host}`);
  return found;
}

// The bare-host match skips path segments and email local parts so relative image paths pass.
function hostLeaks(raw: string): string[] {
  const found: string[] = [];
  for (const [, host] of raw.matchAll(/\/\/([^/\s"?#]+)/g))
    if (!ALLOWED_HOSTS.includes(host)) found.push(`host ${host}`);
  for (const [host] of raw.matchAll(
    /(?<![\p{L}\d/@.-])(?:[\p{L}\d-]+\.)+\p{L}{2,}(?![\p{L}\d@-])/gu,
  ))
    if (!ALLOWED_HOSTS.includes(host)) found.push(`host ${host}`);
  return found;
}

function numberLeaks(raw: string): string[] {
  const found: string[] = [];
  for (const [number] of raw.matchAll(/\+?\d[\d /-]{6,}\d/g))
    if (number !== EXAMPLE.phone) found.push(`number ${number}`);
  return found;
}

function signatureLeaks(signature: unknown): string[] {
  const found: string[] = [];
  const { name, phone, linkedin } = record(signature);
  if (name !== EXAMPLE.name) found.push(`signature ${name}`);
  if (phone !== undefined && phone !== EXAMPLE.phone) found.push(`phone ${phone}`);
  if (linkedin !== undefined && linkedin !== EXAMPLE.linkedin) found.push(`linkedin ${linkedin}`);
  return found;
}

function greetingLeaks(greeting: unknown): string[] {
  const found: string[] = [];
  const first = typeof greeting === "string" ? /(\p{L}+),?\s*$/u.exec(greeting)?.[1] : undefined;
  if (!first || !INVENTED_FIRST_NAMES.includes(first)) found.push(`greeting ${greeting}`);
  return found;
}

function leaks(raw: string): string[] {
  const { greeting, signature } = record(JSON.parse(raw));
  return [
    ...addressLeaks(raw),
    ...hostLeaks(raw),
    ...numberLeaks(raw),
    ...signatureLeaks(signature),
    ...greetingLeaks(greeting),
  ];
}

test.each(readdirSync(dir).filter((f) => f.endsWith(".json")))("%s is invented", (file) => {
  expect(leaks(readFileSync(join(dir, file), "utf-8"))).toEqual([]);
});

test("the greeting must be a string", () => {
  const raw = JSON.stringify({ greeting: ["Moin Robin,"], signature: { name: EXAMPLE.name } });
  expect(leaks(raw)).toEqual(["greeting Moin Robin,"]);
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
