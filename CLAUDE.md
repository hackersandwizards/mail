# CLAUDE.md

The hackers&wizards mail engine as one package, `@hackersandwizards/mail`: React Email components
on `@hackersandwizards/brand`, the Brief mail composed from them, and `mail-render`, which renders
a mail from a data file to its HTML and plain-text part. Company OS runs it and keeps the
recipients, the words and the Gmail drafts. The reasoning is in os
`docs/agent-work/2026-11-02-mail-engine.md`.

This repo is public on GitHub (`github.com/hackersandwizards/mail`), its history included.
Consumers install it as a Git dependency pinned to a tag. `"private": true` stays: nothing is ever
published to a registry. A release is a tag `v<version>` matching `package.json`.

**Anyone can read this whole repo.** No client, recipient, real mail text, price or personal data
goes in. Every word a mail prints is a prop; the catalog data is invented, and
`test/privacy.test.ts` holds its addresses to `example.com`.

## Layout

- `components/theme.ts`: every brand value a mail uses: colours, the picture corner and the
  label's type from `@hackersandwizards/brand/tokens` (resolved values), the mono and sans stacks from
  `@hackersandwizards/brand/fonts.json` (`mail`). No component writes a colour or a stack of its own.
- `components/`: one React Email component per building block. `MailShell` holds the head
  (viewport, `color-scheme`, the dark rules under `prefers-color-scheme` and Outlook.com's
  `data-ogsc`) and the 600 px column; colours reach the dark rules through the `paint` classes.
  `Signature` fills the brand's template; never copy it.
- `mails/Brief.tsx`: the Brief (os row `mail-engine-variant`), `briefText`, the text part the
  engine writes itself rather than stripping the HTML, and `checkBrief`, which `renderBrief` runs
  first and which refuses data that would render a wrong mail.
- `scripts/render.ts`: `renderBrief` and the `mail-render` command. `scripts/modes.ts`: headless
  Chrome for Testing (scaffolding's `./chrome`) views (light, dark, inverted, images blocked), used by the tests and the
  catalog.
- `catalog/`: one Astro app in scaffolding's catalog shell (`catalog/astro.config.ts`, preset
  `catalog({...})`), built to `dist/` by `bun run build` under the base `/mail` of its Pages site
  `https://hackersandwizards.github.io/mail/`, which scaffolding's reusable workflow publishes on
  every push to `main`; `bun run dev` serves it at the root on port 4455, and under a coding agent
  Astro detaches that server, which `bun --bun astro dev stop` in `catalog/` ends.
  Its stories in `catalog/stories/` sit at the site's root, each mail type under `Mails/` light, dark,
  inverted, on a phone and as its text part, the building blocks under `Parts/`; each shows the rendered HTML in a
  frame, since a component in the page is not what a mail client receives. `catalog/mails/*.json`
  holds every mail type's invented data; `catalog/mails/index.ts` renders each with `renderBrief`,
  and the route in `catalog/pages/mails/` serves it as `/mails/<type>.html` and `.txt`, the bytes
  `mail-render` writes, and `.json`, the data file. `Home.astro` fills the shell's home with the
  foundations; the brand elements it shows are listed in `brand-elements.json`, which
  the gate's `elements` step measures on the built home.
- Dependencies can run from the catalog through scripts and mail compositions to components.
  Oxlint bars components from importing compositions, scripts or catalog code, and bars
  compositions from importing scripts or catalog code.
- `bun run check` is scaffolding's runner. `scaffolding.check` in `package.json` lists the
  ordered shared steps and local `check:<what>` scripts.
- `bun run test` runs the tests that need neither a browser nor a catalog build. The pre-push gate
  runs them for source changes. The full gate also runs `browser-test` for the Chrome tests
  in `test/browser/`. Vitest reads the gate's `SCAFFOLDING_TEST_TIMEOUT_MS` for test and hook timeouts.
- `bun run mutation` runs Stryker against the mail engine using the fast Vitest suite.
  It runs outside the gate and writes the JSON report to `.stryker-reports/mutation.json`.

## Release

A release raises `version` in `package.json`, commits, pushes, and tags `v<version>` to match once
the push has landed (`git push origin main && git tag v<version> && git push origin v<version>`):
pushed together, a rejected `main` still publishes the tag. Consumers then raise the tag in their
dependency line.
