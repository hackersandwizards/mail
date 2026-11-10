# Fixes from the whole-repository review, 10.11.2026

A review of the repository at `8871217` listed 35 findings and six ideas. This report gives each
one's state, the measurement behind the test fix, what this machine cannot check in Outlook, and the
blind review that put a destination line and more room into the teaser block.

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

## Outlook (M4)

No Outlook engine runs here: classic Outlook's Word engine runs only on Windows. Sending a test mail
or using a paid render service needs a person's go, so three readings stay open in
`items/outlook-check.md`: whether Outlook.com's dark mode lets the `[data-ogsc]` rules win, whether
classic Outlook keeps the 600 px column, and how its forced inversion looks.

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
- **Where a title leads:** built after the blind review below, as `destination` on an item.
- **A 360 px view:** built, in `test/modes.test.ts` and the Phone stories.
- **The mail font stacks as data in brand:** a brief for brand; `theme.ts` reads them out of the
  signature template until then.
- **Only the dark rules a mail uses:** left. They are 18 % of a 14 KB mail against Gmail's 102 KB
  clip, and half of them hang on the open Outlook.com question.
- **The label one size up:** left. The size is brand's label token, so a change is a brand review
  across every surface, not a mail setting.

## The teaser block: where a title leads, spacing, underline

Three open points from the earlier teaser review: no title said where it leads, the items read
tight, and brand's web link underline (1 px, offset 0.2em) was never scored in a mail.

**Result:** each item may carry `destination`, the words for where its title leads and what it takes
("Video auf YouTube, 32 Min."), set in 14 px muted type right under the title, and the items have
more room (32 px between items, 6 px under the label, 8 px under the title or 2 px above a
destination). The underline stays as it is.

### Method

The catalog Brief, rendered on brand v2.9.0, in five versions:

| Label | Change against Q                                                     |
| ----- | -------------------------------------------------------------------- |
| Q     | none                                                                 |
| R     | destination words in the label line, muted                           |
| T     | destination words as a muted line after the text                     |
| V     | more room: items 20 to 32 px apart, label 4 to 6 px, title 4 to 8 px |
| W     | brand's web link underline on titles, objection link and signature   |

Contrasts fixed before scoring: R and T against Q on criterion 1 and overall, V against Q on
breathing room, calm and overall, W against Q on links, calm and overall. Tie rule fixed before
scoring: a lead inside the noise is a tie, and a tie keeps Q. W's underline shows only where a client
supports `text-underline-offset`: Apple Mail, not Gmail or any Outlook (caniemail, tested
16.01.2023), so every view was Apple Mail.

Round two, from the reasons of round one: B is T, F is T with V's room, K is F with the destination
line under the title. The destination words named the platform in round two ("Auf unserer Website,
6 Min. Lesezeit", "Player auf unserer Website, 41 Min.", "Video auf YouTube, 32 Min."), the same in
all three versions, since every reviewer of round one asked which site or player opens.

Each version sat in a plain reading pane: Apple Mail on a Mac, 800 px wide, day and night (the
mail's own dark rules), at 2x and downscaled to 1000 px; on a 390 px iPhone screen at 3x; and the
three items cut out at 2x. The pane is a neutral mock, not checked against a screenshot of Apple
Mail. Reviewers: Claude Opus 5.5 at medium effort via `claude -p`, from a folder holding only the
images, file order shuffled per reviewer: a head of engineering at a 200-person software company, a
senior developer who attended a training, and a design lead for B2B mail, twice for the noise.

### Scores

Mean over the three views, first runs (3 reviewers), 1 to 10:

| Round | Version | Destination clear | Links | Hierarchy | Calm | Room | Fit  | Overall |
| ----- | ------- | ----------------- | ----- | --------- | ---- | ---- | ---- | ------- |
| 1     | Q       | 4.00              | 8.67  | 9.00      | 7.11 | 7.00 | 6.33 | 6.33    |
| 1     | R       | 8.67              | 8.67  | 7.22      | 6.00 | 6.78 | 7.67 | 7.00    |
| 1     | T       | 8.67              | 8.67  | 9.00      | 8.00 | 7.00 | 8.67 | 8.33    |
| 1     | V       | 4.00              | 8.67  | 9.00      | 8.33 | 8.89 | 6.33 | 6.78    |
| 1     | W       | 4.00              | 9.00  | 9.00      | 8.33 | 7.00 | 6.33 | 6.67    |
| 2     | B       | 8.00              | 9.33  | 9.00      | 7.11 | 6.22 | 7.67 | 7.00    |
| 2     | F       | 8.00              | 9.33  | 9.33      | 8.33 | 8.89 | 8.00 | 8.00    |
| 2     | K       | 9.00              | 9.33  | 8.00      | 7.89 | 8.89 | 9.00 | 8.67    |

Noise, the design lead's two runs, on the overall per version: round one 0.07 (largest 0.33), round
two 0.22 (largest 0.67, on K).

- **Destination:** T leads Q by 2.0 overall and R by 1.3, far outside the noise. R's long capitals
  line read as noise ("reads like a log line"). In round two K leads F by 0.67 on the overall, by
  1.0 on destination and fit, and trails it by 1.33 on hierarchy: the text drops to fourth place.
  That lead is outside the mean noise but equals the spread on K itself, where the design lead's
  second run scored K and F alike. On the strict reading that makes K and F a tie; K shipped on the
  mean, as the earlier teaser review counted, and that choice is an assumption of this run.
- **Room:** V leads Q by 1.9 on breathing room and 0.45 overall; F leads B by 1.0 overall. Both
  outside the noise.
- **Underline:** W leads Q by 0.33 overall and 1.2 on calm, outside the noise of one model, and
  every reviewer called it the cleanest link. It changes brand's signature links and reaches Apple
  Mail readers only, so it goes to brand as a brief rather than into the mail.

Still open after round two, named by every reviewer: whether a podcast plays in the reader's own
app. That is a matter of the words os writes, not of the engine.

Skipped combinations: Gmail and Outlook (the destination and spacing render there as in Apple Mail;
the underline does not), forced inversion, Codex as a second model, and the page each title opens,
since the catalog's links lead to `example.com`.

The prompt of the design lead in round two, verbatim except the file list:

```text
You are a design lead who audits B2B mail for brands and checks how mails render in Apple Mail and Gmail.

You receive a short update mail from a software consultancy you work with. It lists three items (an article, a podcast episode, a talk), each with a small capitals label, a title and one or two sentences. You compare three versions of the same mail: B, F and K. Medium: an HTML mail read in Apple Mail, on a Mac with a Retina screen in the day theme and the night (dark) theme, and on an iPhone. File names say the version and the view: "desktop-day" and "desktop-night" are the whole reading pane, 800 px wide, downscaled to 1000 px on the long side, for layout; "phone-day" is the whole mail on a 390 px wide iPhone screen; "teasers" are the three items cut out of desktop-day at full resolution (2x pixels), for legibility.

Open every file below with the Read tool before you answer:
- (12 images)

First, for each version, list every element you would expect to click and say, for each item title, where you expect the click to take you.

Then score each version B, F and K separately for each of desktop-day, desktop-night and phone-day, on a scale of 1 to 10:
1. Before clicking, I know where each title leads and what it costs me (a page to read, something to listen to or watch, how long).
2. The item titles are recognised as links at a glance.
3. The small capitals label above each title is legible and calm at real size.
4. Hierarchy: label, title and text read in that order, the title first in weight.
5. Visual calm.
6. Breathing room, not cramped.
7. Fit for you as the reader of this mail.
8. Overall.

Then, for every score below 10, say in one line what keeps it below 10. Then say which question the mail still leaves open for you about where a title leads.

Answer in this form:
CLICK: one line per version
TABLE: one line per version and view: <version> <view> | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
BELOW 10: one line per reason
OPEN QUESTION: one line
```

Review: medium, because a recipient sees it in every customer update; one model, the noise measured.
