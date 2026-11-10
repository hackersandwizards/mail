# @hackersandwizards/mail

The hackers&wizards mail engine: React Email components on the brand tokens and a command that
renders a mail from a data file to its HTML part and its plain-text part. Company OS installs it
and keeps what fills a mail: the recipients, the words, the drafts.

Maintainer: Benedikt Stemmildt. The repo is public, its history included, so nothing goes in that
may not be public. Every recipient and every word in the catalog data is invented; the signature
template is the brand's own.

The catalog shows every building block and every mail type, published at
https://hackersandwizards.github.io/mail/catalog/ on every push to `main`.

## Use it in another repo

Add the dependency pinned to the newest tag
(`git ls-remote --tags https://github.com/hackersandwizards/mail.git` lists them), next to
`@hackersandwizards/brand`, whose colours, mail font stacks and signature the mails use:

```json
"@hackersandwizards/mail": "git+https://github.com/hackersandwizards/mail.git#v<version>"
```

| Import or command                              | What                                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------------- |
| `bun run mail-render <data.json> --out <path>` | writes `<path>.html` and `<path>.txt`; without `--out`, prints the HTML     |
| `@hackersandwizards/mail/render`               | `renderBrief(props)`, returning `{ html, text }`                            |
| `@hackersandwizards/mail/mails/Brief`          | the Brief mail and its `BriefProps`                                         |
| `@hackersandwizards/mail/components/<Name>`    | `MailShell`, `Paragraph`, `Item`, `Image`, `Signature`, `ObjectionNotice`   |
| `@hackersandwizards/mail/theme`                | the colour roles, the mail font stacks and the label's type, from the brand |

The data file holds every word of the mail except the brand's signature template;
[`catalog/mails/brief.json`](catalog/mails/brief.json) shows its shape. `renderBrief` and
`mail-render` refuse a data file with a missing, empty or unknown field, a link other than https, an
image size that is no whole pixel or an objection address carrying a query, and name the field.

## Images

`Image` keeps its box while a client blocks pictures: width and height as whole pixels in the
attribute and the style, the brand tint behind the image and its cell, and alt text in Arial 12/16,
muted, without the link underline. It refuses an image wider than the column on a 360 px phone
(295 px).
Classic Outlook on Windows shows its own notice instead of styled alt text.

## Work on the package

Requirements: Bun 1.3 or newer and `gitleaks` (`brew install gitleaks`) for the commit hook. The
headless test starts Chrome for Testing, and its first run installs it into `~/.cache/puppeteer`.

```sh
git clone https://github.com/hackersandwizards/mail.git && cd mail
bun install                                  # also points the git hooks at .githooks/
bun run dev                                  # the catalog at http://127.0.0.1:4455/
bun scripts/render.ts catalog/mails/brief.json --out /tmp/brief   # /tmp/brief.html and .txt
bun run check                                # the whole gate
```

The catalog shows every mail type light, dark, inverted, at phone width and as its text part
under `Mails/`; each
renders to `/mail/mails/<type>.html`, `.txt` and `.json`. `bun run build` writes the catalog to `dist/`.

`bun run check` runs scaffolding's shared steps (format, lint, styles, types, tests, the catalog
build and more), then this repository's own steps, the `check:*` scripts `package.json` names under
`scaffolding.check`. The git hooks check the staged files, the commit message and each push;
[.githooks/README.md](.githooks/README.md) lists them.

## Release

A release raises `version` in `package.json`, commits, pushes, and tags `v<version>` to match once
the push has landed (`git push origin main && git tag v<version> && git push origin v<version>`):
pushed together, a rejected `main` still publishes the tag. Consumers then raise the tag in their
dependency line. The layout and the rules for changing it: [CLAUDE.md](CLAUDE.md).

Security issues: [SECURITY.md](SECURITY.md). Licence: PolyForm Strict 1.0.0, see
[LICENSE](LICENSE).
