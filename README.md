# @hackersandwizards/mail

The hackers&wizards mail engine: React Email components on the brand tokens and a command that
renders a mail from a data file to its HTML part and its plain-text part. Company OS installs it
and keeps what fills a mail: the recipients, the words, the drafts.

Maintainer: Benedikt Stemmildt. The repo is public, its history included, so nothing goes in that
may not be public. Every person and address in the catalog is invented.

`bun run dev` serves the catalog at `http://127.0.0.1:4455/mail/catalog/` and every mail type
light, dark, inverted and at phone width at `http://127.0.0.1:4455/mail/mails/`. `bun run build`
writes both to `dist/`, which GitHub Pages publishes at `https://hackersandwizards.github.io/mail/`
on every push to `main`.

## Use it in another repo

Add the dependency pinned to the newest tag
(`git ls-remote --tags https://github.com/hackersandwizards/mail.git` lists them), next to
`@hackersandwizards/brand`, whose colours, mail font stacks and signature the mails use:

```json
"@hackersandwizards/mail": "git+https://github.com/hackersandwizards/mail.git#v<version>"
```

| Import or command                              | What                                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| `bun run mail-render <data.json> --out <path>` | writes `<path>.html` and `<path>.txt`; without `--out`, prints the HTML               |
| `@hackersandwizards/mail/render`               | `renderBrief(props)`, returning `{ html, text }`                                      |
| `@hackersandwizards/mail/mails/Brief`          | the Brief mail and its `BriefProps`                                                   |
| `@hackersandwizards/mail/components/<Name>`    | `MailShell`, `Wordmark`, `Paragraph`, `Item`, `Image`, `Signature`, `ObjectionNotice` |
| `@hackersandwizards/mail/theme`                | the colour roles and the mail font stacks, from the brand                             |

The data file holds every word of the mail; `catalog/mails/brief.json` shows its shape.

## Images

`Image` keeps its box while a client blocks pictures: width and height as whole pixels in the
attribute and the style, the brand tint behind the image and its cell, and alt text in Arial 12/16,
muted, without the link underline. It refuses an image wider than the phone column (320 px).
Classic Outlook on Windows shows its own notice instead of styled alt text.

## Checks

`bun run check` is scaffolding's gate runner: format, lint, styles, types, structure, coupling,
unique names, the confidential terms, the tests (render, the blocked-image fix, every mail headless
in light, dark, inverted and with images blocked, the catalog data's privacy) and the catalog
build, then the brand colour scan (`check:colours`), `brand-elements` on the built catalog home
(`check:elements`) and the item check (`check:admin`). The pre-commit hook runs
`bun run check:staged`: gitleaks over the staged changes, coupling and confidential terms, then
prettier and eslint on the staged files. The headless test needs Chrome for Testing:
`bunx @puppeteer/browsers@3.2.6 install chrome@stable --path ~/.cache/puppeteer`.
