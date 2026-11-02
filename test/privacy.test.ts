// The repo is public: the specimen carries invented people and example addresses only.
import { expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = join(import.meta.dir, "..", "specimen");
const ALLOWED_HOSTS = ["example.com", "www.hackersandwizards.dev", "www.linkedin.com"];
const INVENTED = ["Kim Beispiel"];

test.each(readdirSync(dir).filter((f) => f.endsWith(".json")))("%s is invented", (file) => {
  const raw = readFileSync(join(dir, file), "utf-8");
  for (const [, address] of raw.matchAll(/[\w.+-]+@([\w.-]+\.\w+)/g)) {
    expect(address).toBe("example.com");
  }
  for (const [url] of raw.matchAll(/https?:\/\/[^\s"]+/g)) {
    expect(ALLOWED_HOSTS).toContain(new URL(url).host);
  }
  expect(INVENTED).toContain(JSON.parse(raw).signature.name);
});
