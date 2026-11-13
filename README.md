# @hackersandwizards/mail

The hackers&wizards mail engine: React Email components on the brand tokens and a command that
renders a mail from a data file to its HTML part and its plain-text part. Company OS installs it
and keeps what fills a mail: the recipients, the words, the drafts.

| You want                                  | Go to                                                    |
| ----------------------------------------- | -------------------------------------------------------- |
| every building block and mail type, shown | the [catalog](https://hackersandwizards.github.io/mail/) |
| to render mails from your repository      | [Use it in another repo](#use-it-in-another-repo)        |
| the fields a mail's data file holds       | [catalog/mails/brief.json](catalog/mails/brief.json)     |
| to change the engine                      | [Work on the package](#work-on-the-package)              |
| to release a change                       | [CLAUDE.md](CLAUDE.md#release)                           |
| to know what you may do with it           | [LICENSE](LICENSE)                                       |
| to report a vulnerability                 | [SECURITY.md](SECURITY.md)                               |

## Use it in another repo

Add the dependency pinned to the newest tag
(`git ls-remote --tags https://github.com/hackersandwizards/mail.git` lists them), next to
`@hackersandwizards/brand`, whose colours, mail font stacks and signature the mails use:

```json
"@hackersandwizards/mail": "git+https://github.com/hackersandwizards/mail.git#v<version>"
```

- `bun run mail-render <data.json> --out <path>`: writes `<path>.html` and `<path>.txt`; without `--out`, prints the HTML
- `@hackersandwizards/mail/render`: `renderBrief(props)`, resolving to `{ html, text }`
- `@hackersandwizards/mail/mails/Brief`: the Brief mail and its `BriefProps`
- `@hackersandwizards/mail/components/<Name>`: `MailShell`, `Paragraph`, `Item`, `Image`, `Signature`, `ObjectionNotice`
- `@hackersandwizards/mail/theme`: the colour roles, the mail font stacks and the label's type, from the brand

```ts
import { readFileSync } from "node:fs";
import { renderBrief } from "@hackersandwizards/mail/render";

const { html, text } = await renderBrief(JSON.parse(readFileSync("brief.json", "utf-8")));
```

The data file holds every word of the mail except the brand's signature template;
[`catalog/mails/brief.json`](catalog/mails/brief.json) shows its shape. `renderBrief` and
`mail-render` refuse a data file with a missing, empty or unknown field, a link other than https, an
image size that is no whole pixel or wider than the phone column, a subject, objection subject or
signature field spanning lines, or an objection address carrying a query or an escape, and name the
field.

## Work on the package

Requirements: Bun 1.4 or newer, which the gate's `admin-check` declares, and `gitleaks`
(`brew install gitleaks`) for the commit hook. The headless test starts Chrome for Testing, and its
first run installs it into `~/.cache/puppeteer`.

- `git clone https://github.com/hackersandwizards/mail.git`, `cd mail`, then `bun install`, which also points
  the git hooks at `.githooks/` ([.githooks/README.md](.githooks/README.md) lists them)
- `bun run dev`: the catalog at http://127.0.0.1:4455/
- `bun scripts/render.ts catalog/mails/brief.json --out /tmp/brief`: `/tmp/brief.html` and `.txt`
- `bun run check`: the whole gate; a `check:*` script run alone needs `bun run build` first
- `bun run build`: the catalog in `dist/`

A release is a tag `v<version>` matching `package.json`; [the steps](CLAUDE.md#release), the layout and the
rules for changing it are in [CLAUDE.md](CLAUDE.md).

Maintainer: Benedikt Stemmildt. Licence: PolyForm Strict 1.0.0, see [LICENSE](LICENSE).
