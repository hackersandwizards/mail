# CLAUDE.md

The hackers&wizards mail engine as one package, `@hackersandwizards/mail`: React Email components
on `@hackersandwizards/brand`, the Brief mail composed from them, and `mail-render`, which renders
a mail from a data file to its HTML and plain-text part. Company OS runs it and keeps the
recipients, the words and the Gmail drafts. The reasoning is in os
`docs/tracking/2026-11-02-mail-engine.md`.

This repo is public on GitHub (`github.com/hackersandwizards/mail`), its history included.
Consumers install it as a Git dependency pinned to a tag. `"private": true` stays: nothing is ever
published to a registry. A release is a tag `v<version>` matching `package.json`.

**Anyone can read this whole repo.** No client, recipient, real mail text, price or personal data
goes in. Every word a mail prints is a prop; the catalog data is invented, and
`test/privacy.test.ts` holds its addresses to `example.com`.

## Layout

- `components/theme.ts`: every brand value a mail uses: colours from
  `@hackersandwizards/brand/tokens` (resolved hex), the mono and sans stacks read out of the brand's
  mail-signature template. No component writes a colour or a stack of its own.
- `components/`: one React Email component per building block. `MailShell` holds the head
  (viewport, `color-scheme`, the dark rules under `prefers-color-scheme` and Outlook.com's
  `data-ogsc`) and the 600 px column; colours reach the dark rules through the `paint` classes.
  `Signature` fills the brand's template; never copy it.
- `mails/Brief.tsx`: the Brief (os row `mail-engine-variant`) and `briefText`, the text part the
  engine writes itself rather than stripping the HTML.
- `scripts/render.ts`: `renderBrief` and the `mail-render` command. `scripts/modes.ts`: headless
  Chrome for Testing views (light, dark, inverted, images blocked), used by the tests and the
  catalog.
- `catalog/`: one Astro app in scaffolding's catalog shell (`catalog/astro.config.ts`, preset
  `catalog({...})`), built to `dist/` by `bun run build`, served on port 4455 by `bun run dev`.
  Its stories in `catalog/stories/` sit at `/catalog`, the mail under `Mails/`, the building blocks
  under `Parts/`; each shows the rendered HTML in a frame, since a component in the page is not
  what a mail client receives. `catalog/mails/*.json` holds every mail type's invented data, and
  the routes in `catalog/pages/mails/` render each with `renderBrief` to `/mails/<type>.html` and
  `.txt`, the bytes `mail-render` writes, with `/mails/` showing them light, dark, inverted and on
  a phone. `Home.astro` fills the shell's home with the foundations; the brand elements it shows
  are listed in `brand-elements.json`, which `bun run check:elements` measures on the built home.
- `bun run check` is scaffolding's runner; the repository's own steps are the `check:<what>`
  scripts named in `package.json` under `scaffolding.check`.
