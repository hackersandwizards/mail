# Teaser block: two blind reviews, 10.11.2026

The first review settled the underline on the titles and the label weight, the second where a title
leads and the room between the items.

## First review: underline and label weight

Two open points from the cross-surface brand review: the teaser titles were bold teal without an
underline, and the label above each was Menlo bold while brand's label weight is 500. Brand v2.9.0
now underlines the signature's links, so the footer and signature links were underlined and the
titles were not.

**Result:** titles underlined, labels at brand's weight (`--type-label-weight`, 500). The mail's
mono stack (Menlo, Consolas, Courier New) has no medium face, so a client draws the label in the
regular one: the comparison was bold against regular. Built in mail v1.3.0: `accentLink` in
`components/MailShell.tsx` underlines the titles and the objection link, `label` in
`components/theme.ts` reads the weight with the rest of brand's label type, and the brand peer range started at v2.9.0,
the first release with the signature's underlined links.

### Method

The Brief with a picture (`catalog/mails/brief-bild.json`) was rendered on brand v2.9.0, and four
versions were made from that HTML:

| Label | Title                          | Label weight |
| ----- | ------------------------------ | ------------ |
| H     | bold teal, no underline (old)  | bold         |
| N     | bold teal, no underline        | 500          |
| S     | bold teal, underlined          | 500          |
| F     | bold teal, brand's arrow after | 500          |

The contrasts were fixed before scoring: the label is N against H, the link is S and F against N.
The tie rule was fixed before scoring too: H is the exception to brand's label weight and stays only
with a lead outside the noise in both models. A tie between S and F goes to S, since brand's link
in text is underlined.

Each version sat in a Gmail web mock and an Apple Mail mock on a 1280 × 1500 px desktop window, day
and night. Gmail web's dark theme darkens only its own frame and drops the mail's
`prefers-color-scheme` rules. Apple Mail applies the mail's own dark rules. The mocks were not
checked against a real screenshot of either client. Window shots were downscaled to 1000 px, and
the three teasers were cut out at 2x for legibility. Gmail night has only the window shot, since its
teasers equal Gmail day. That makes 28 images.

Reviewers (Claude Opus via `claude -p`, Codex gpt-6.1-sol, from a folder holding only the images):
a head of engineering at a 200-person software company (both models), a senior developer who
attended a training (Claude), and a design lead for B2B mail (both models, twice each for the
noise). Criteria, 1 to 10, fixed before any score: titles recognised as links, label legible and
calm, hierarchy, visual calm, breathing room, fit for the reader, overall. Each reviewer first
listed what they would click. The Codex runs opened the hub's `shell-tools`, `voice` and
`blind-review` skills and the global rules on their own; none of those names a version of this
review or says which one is current.

### Scores

Mean over the four views, first runs (Claude: 3 reviewers, Codex: 2):

| Criterion              | Model  | H   | N   | S    | F   |
| ---------------------- | ------ | --- | --- | ---- | --- |
| Overall                | Claude | 7.0 | 7.3 | 8.0  | 7.7 |
| Overall                | Codex  | 8.0 | 8.0 | 9.0  | 8.0 |
| Titles read as links   | Claude | 6.3 | 6.3 | 9.3  | 8.0 |
| Titles read as links   | Codex  | 7.0 | 7.0 | 10.0 | 9.0 |
| Label legible and calm | Claude | 7.6 | 8.3 | 8.3  | 8.3 |
| Label legible and calm | Codex  | 8.5 | 8.9 | 8.9  | 8.9 |

Noise, the design lead's two runs: Claude 0.25 on the overall (0.47 per cell), Codex 0.00 (0.25
per cell).

- **Label:** N leads H by 0.3 overall on Claude and ties on Codex. H, the exception, leads nowhere,
  so the label takes brand's weight. Every reviewer called the bold label loud or emphatic beside
  the title. All four Claude runs called the regular one thin at real size, the Codex runs small.
- **Link:** S leads N by 0.7 (Claude) and 1.0 (Codex), outside the noise with both models. S leads
  F by 0.3 on Claude, inside the noise, and by 1.0 on Codex. F's arrow wrapped the first title onto
  a second line, which every reviewer named.

What keeps S below 10, named by every reviewer: three underlined bold titles cost calm (Claude 6.7
against N's 8.8). The underline is brand's plain `text-decoration: underline`, as in the signature
and the footer. A thinner underline with an offset (brand's web link) was scored in the second review, with
where a title leads and the spacing. A Gmail night
view keeps a white mail inside a dark frame, which reviewers named for every version. All of them
asked where a title leads; the second review answers that too.

Skipped combinations: Outlook (classic and Outlook.com), forced inversion (Gmail app, classic
Outlook), phone width, and the step after the click.

The prompt of the Claude design lead, verbatim except the file list (28 paths, shuffled per
reviewer):

```text
You are a design lead who audits B2B mail for brands and checks how mails render in Gmail and Apple Mail.

You receive a short update mail from a software consultancy you work with. It lists three items (an article, a podcast episode, a talk), each with a small capitals label, a title and one or two sentences. You compare four versions of the same mail, H, N, S and F. Medium: an HTML mail read on a desktop, in Gmail in the browser at 100 % and in Apple Mail on a Mac with a Retina screen, each in the day theme and the night (dark) theme of the mail program. File names say the version, the mail program (gmail, applemail), the theme (day, night) and the view: "window" is the whole mail program window, downscaled to 1000 px on its long side, for layout; "teasers" is the three items cut out at full resolution (2x pixels of a 1280 px window), for legibility. Gmail's night theme leaves the mail itself on its light ground, so Gmail night has only a window view.

Open every file below with the Read tool before you answer:
- (28 images)

First, for each version, list every element in the mail you would expect to click, as a reader seeing it for the first time.

Then score each version H, N, S and F separately for each of gmail day, gmail night, applemail day and applemail night, on a scale of 1 to 10:
1. The item titles are recognised as links at a glance.
2. The small capitals label above each title is legible and calm at real size.
3. Hierarchy: label, title and text read in that order, the title first in weight.
4. Visual calm.
5. Breathing room, not cramped.
6. Fit for you as the reader of this mail.
7. Overall.

Then, for every score below 10, say in one line what keeps it below 10. Then say which question the mail leaves open for you about where a title leads.

Answer in this form:
CLICK: one line per version
TABLE: one line per version and view: <version> <program> <theme> | 1 | 2 | 3 | 4 | 5 | 6 | 7
BELOW 10: one line per reason
OPEN QUESTION: one line
```

Review: large, because a shared element (the link, the label) changed on one surface, decided as
an exception question across two models with the noise measured.

## Second review: where a title leads, spacing, underline

Three open points from the first review: no title said where it leads, the items read
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
  mean, as the first review counted, and that choice is an assumption of this run.
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
