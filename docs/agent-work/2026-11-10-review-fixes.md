# Fixes from the whole-repository review, 10.11.2026

A review of the repository at `8871217` listed 35 findings and six ideas. This report gives each
one's state and the measurement behind the test fix. What this machine cannot check in Outlook is
open as `items/outlook-check.md`; the blind review that put a destination line and more room into
the teaser block is in
[2026-11-10-teaser-links-label-review.md](2026-11-10-teaser-links-label-review.md).

## Findings

| Id     | State                                                                                                                                                                                                                                                                               |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M1, M7 | Fixed. `checkBrief` in `mails/Brief.tsx` runs first in `renderBrief`: a missing or empty field, a language other than `de` or `en`, a link other than https, an objection address with a query of its own fail, naming the field. The mailto body encodes a line break as `%0D%0A`. |
| M2     | Fixed at the cause, measured below.                                                                                                                                                                                                                                                 |
| M3     | Fixed. The narrowest phone is 360 px, so the widest image is 295 px; the headless test draws one that wide at 360 px.                                                                                                                                                               |
| M4     | Not checkable here; open as `items/outlook-check.md`.                                                                                                                                                                                                                               |
| M5     | Fixed. The Light, Phone and Inverted stories switch the dark rules off, as Dark switches them on.                                                                                                                                                                                   |
| M6     | Fixed. The privacy test reads hosts with and without a scheme, addresses in any script, numbers, the LinkedIn address and the greeting's first name, against brand's invented person. It does not read the closing lines, the signature role or a name outside the greeting.        |
| M8     | Fixed. The headless test reads every colour an element sets inline, in every mode.                                                                                                                                                                                                  |
| M9     | Fixed. A load-time guard refuses a signature template colour that no dark rule reaches.                                                                                                                                                                                             |
| M10    | Brief for os.                                                                                                                                                                                                                                                                       |
| M11a   | Fixed. The text part has no `-- ` line, so no program files the objection notice as signature.                                                                                                                                                                                      |
| M11b   | Fixed. A preview over React Email's 200 characters is refused.                                                                                                                                                                                                                      |
| M11c   | Not reproduced. The `target="_blank"` on the objection link is in the markup; the empty tab it may open needs a webmail client.                                                                                                                                                     |
| M11d   | Fixed. The tests compare strings escaped as React writes them; with `&`, `'` and a query in the data the old tests failed three cases.                                                                                                                                              |
| M11e   | Fixed. `forceDark`, `forceLight` and `forceInvert` throw where the mail lacks what they replace.                                                                                                                                                                                    |
| M11f   | Fixed. A frame shrinks to its mail: the Item story went from 902 to 168 px.                                                                                                                                                                                                         |
| M11g   | Fixed. `check:frames` decodes the path; a mail named with a space answered 404 before.                                                                                                                                                                                              |
| M11h   | Fixed. `files` is gone: os's install of v1.2.19 held every tracked file.                                                                                                                                                                                                            |
| M11i   | Fixed. The tests keep their scratch in `node_modules/.cache/mail-test/`.                                                                                                                                                                                                            |
| M11j   | Fixed in the README; documents' README carries the same line.                                                                                                                                                                                                                       |
| M11k   | Fixed. Puppeteer loads inside `launch` only.                                                                                                                                                                                                                                        |
| M11l   | Fixed. The shell's `storyScale` and `htmlClass` set what the head script set, and the shell links the svg icon.                                                                                                                                                                     |
| M11m   | Fixed with M12: the doc comment sits on `label`.                                                                                                                                                                                                                                    |
| M12    | Fixed. `label` in `components/theme.ts` takes size (0.75rem as 12 px), line height (1.4, 16.8 px), weight, tracking and case from brand's tokens, and the text part takes the case from it.                                                                                         |
| M13a   | Left. The colour test of M8 catches a part that sets a colour without its class, which the helper would prevent.                                                                                                                                                                    |
| M13b   | Fixed. The home uses brand's `Element.astro`.                                                                                                                                                                                                                                       |
| M13c   | Fixed.                                                                                                                                                                                                                                                                              |
| M13d   | Fixed.                                                                                                                                                                                                                                                                              |
| M13e   | Fixed. `roles` is exported beside `Role`.                                                                                                                                                                                                                                           |
| M13f   | Fixed in the stories and tests; `previewSize` in `catalog/astro.config.ts` keeps 602, since the config would have to load the React components.                                                                                                                                     |
| M13g   | Left. `brief-bild.json` is also `mail-render` input and the body of its `.json` route; derived, it would be neither.                                                                                                                                                                |
| M13h   | Left. The story needs the picture as a module, and the data names it as a sent mail would.                                                                                                                                                                                          |
| M13i   | Fixed. `itemText` sits beside `Item`.                                                                                                                                                                                                                                               |
| M13j   | Fixed.                                                                                                                                                                                                                                                                              |
| M13k   | Brief for scaffolding.                                                                                                                                                                                                                                                              |

## The slow close in the headless test (M2)

`afterAll` awaited Chrome's graceful close, and bun gives a hook 5 s. Timed on this machine at 32
views a run, twice the 16 that `test/modes.test.ts` opened then (18 now):

| Close    | Runs | Load (1 min) | Time            |
| -------- | ---- | ------------ | --------------- |
| graceful | 10   | 137 to 223   | 114 to 3,262 ms |
| kill     | 4    | 137 to 152   | 28 to 43 ms     |

The graceful runs and the kill runs alternated at the same load. Puppeteer's removal of its profile
took under 40 ms of each graceful close; the rest was Chrome's own shutdown. What pushed it past 5 s
in the gates of 06.11. and 10.11. is not shown beyond load: the slowest close (3.3 s) came at
load 189, while one at 221 took 0.2 s. `quit` in `scripts/modes.ts` now kills Chrome and then lets
puppeteer remove the profile, which a kill alone left behind.

`beforeAll` has the same 5 s limit and is left as it is: its Chrome launch took 0.5 to 2.3 s in
the 17 timed runs, and no gate in the review or in this run failed there.

## The catalog favicon

v2.0.0's catalog linked the brand's `.ico` after the svg the shell links, so a browser that takes
the last icon showed the `.ico`. v2.0.1 links the svg again after it, and `check:frames` fails where
the home's last icon link is not the svg; with the old order it failed, as a control. The
last-icon rule is read from the markup, not from watching which file a browser fetched.

## Reviews of this run's code

`/simplify` and `/code-review high` ran on the changes, each as a nested `claude -p` on Claude Opus
5.5 at high effort.

- **`/simplify`, first batch:** ten cleanups, nine applied. A shared scratch-folder helper for the
  three test files was left: they share no helper file yet.
- **`/simplify`, second batch:** four cleanups, all applied.
- **`/code-review`:** ten findings, six fixed and two in part: a missing file or malformed JSON
  now ends on the `mail-render: <file>:` line; image width and height, an unknown field and a line break in the
  objection subject are refused with their path; a protocol-relative image source is refused; the
  signature guard also reports a background, border or `bgcolor` colour, with a test for a
  background and for `bgcolor`;
  the Text story takes the mail's language. One fixed in part: an https link must now parse as a
  URL, so `https:// x` is refused; the LinkedIn and alt rules `checkBrief` shares with brand's
  `fillSignature` and `Image` stay, since `checkBrief` refuses before anything renders and names
  the data path. Left, the second half of the image source finding included:
  - a relative image source still passes, since the catalog serves its picture that way and os
    writes no image today;
  - the load-time guards in `theme.ts` stay: without them a respelled signature colour turns dark
    text dark-on-dark with no error, and the gate checks them at the brand version mail pins;
  - the forced-light frames keep the mail's `color-scheme`: measured white under a dark viewer,
    and a frame sized to its mail shows no scrollbar the scheme could paint.

## Ideas from the review

- **The text part in the catalog:** built, a Text story beside each mail.
- **Where a title leads:** built after the second teaser review, as `destination` on an item.
- **A 360 px view:** built, in `test/modes.test.ts` and the Phone stories.
- **The mail font stacks as data in brand:** built in brand v2.11.0; `theme.ts` reads the `mail`
  stacks of its `fonts.json`.
- **Only the dark rules a mail uses:** left. They are 18 % of a 14 KB mail against Gmail's 102 KB
  clip, and half of them hang on the open Outlook.com question.
- **The label one size up:** left. The size is brand's label token, so a change is a brand review
  across every surface, not a mail setting.
