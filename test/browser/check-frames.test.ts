import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempDisposableSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, test } from "vitest";

const cache = join(import.meta.dirname, "../../node_modules/.cache/mail-test");

function runFrameCheck({ home, story }: { home?: string; story?: true }) {
  mkdirSync(cache, { recursive: true });
  using fixture = mkdtempDisposableSync(join(cache, "frames-"));
  mkdirSync(join(fixture.path, "scripts"));
  for (const name of ["check-frames.ts", "dist-path.ts", "modes.ts"])
    copyFileSync(
      new URL(`../../scripts/${name}`, import.meta.url),
      join(fixture.path, "scripts", name),
    );
  mkdirSync(join(fixture.path, "dist"));
  if (home !== undefined) writeFileSync(join(fixture.path, "dist/index.html"), home);
  if (story) {
    mkdirSync(join(fixture.path, "dist/stories/example"), { recursive: true });
    writeFileSync(join(fixture.path, "dist/stories/example/index.html"), "<p>Story</p>");
  }
  return spawnSync("bun", ["scripts/check-frames.ts"], {
    cwd: fixture.path,
    env: { ...process.env, TMPDIR: fixture.path },
    encoding: "utf-8",
    timeout: 30_000,
  });
}

function frameDiagnostics(stderr: string) {
  return stderr.replaceAll(/http:\/\/127\.0\.0\.1:\d+/g, "http://127.0.0.1:PORT").split("\n");
}

test("explains how to restore a missing story in the catalog build", () => {
  const { status, stderr } = runFrameCheck({ home: "<p>Home</p>" });
  expect(status, stderr).toBe(1);
  expect(stderr.split("\n")).toContain(
    "error: check:frames: The build contains no story pages, so there are no story frames to check. Restore a story under catalog/stories/ and run bun run build.",
  );
});

test("explains how to restore a catalog page that returns 404", () => {
  const { status, stderr } = runFrameCheck({ story: true });
  expect(status, stderr).toBe(1);
  expect(frameDiagnostics(stderr)).toContain(
    "http://127.0.0.1:PORT/mail/: The catalog page could not load (response status 404). Check the base in catalog/astro.config.ts and run bun run build to regenerate the route.",
  );
});

describe("the catalog home", () => {
  let lines: string[];
  beforeAll(() => {
    const { status, stderr } = runFrameCheck({
      home: '<link rel="icon" type="image/svg+xml" href="icon.svg"><link rel="icon" href="icon.ico"><img src="missing.png">',
      story: true,
    });
    expect(status, stderr).toBe(1);
    lines = frameDiagnostics(stderr);
  });

  test("explains how to restore tile previews", () => {
    expect(lines).toContain(
      "http://127.0.0.1:PORT/mail/: No tile frame opened, so the catalog home shows no story previews. Set previews to true in catalog/astro.config.ts and export a story state in catalog/stories/.",
    );
  });

  test("explains how to fix favicon order", () => {
    expect(lines).toContain(
      "http://127.0.0.1:PORT/mail/: The last icon link must be SVG for browsers to prefer it. Put the image/svg+xml link after the ICO link in catalog/Head.astro.",
    );
  });

  test.each(["404", "painted nothing"])("explains how to fix an image failure (%s)", (reason) => {
    expect(lines).toContain(
      `http://127.0.0.1:PORT/mail/: The catalog could not load or display http://127.0.0.1:PORT/mail/missing.png (${reason}). Restore the resource at that URL or correct its source in catalog/stories/, catalog/mails/, or catalog/astro.config.ts.`,
    );
  });
});
