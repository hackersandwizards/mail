# Teaser titles and label weight: blind review, 10.11.2026

Two open points from the cross-surface brand review: the teaser titles were bold teal without an
underline, and the label above each was Menlo bold while brand's label weight is 500. Brand v2.9.0
now underlines the signature's links, so the footer and signature links were underlined and the
titles were not.

**Result:** titles underlined, labels at brand's weight (`--type-label-weight`, 500). The mail's
mono stack (Menlo, Consolas, Courier New) has no medium face, so a client draws the label in the
regular one: the comparison was bold against regular. Built in mail v1.3.0: `accentLink` in
`components/MailShell.tsx` underlines the titles and the objection link, `labelWeight` in
`components/theme.ts` reads the weight, and the brand peer range starts at v2.9.0, the first
release with the signature's underlined links.

## Method

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

## Scores

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
and the footer. A thinner underline with an offset (brand's web link) was not scored. A Gmail night
view keeps a white mail inside a dark frame, which reviewers named for every version. All of them
asked where a title leads: a page on the website, a podcast player, a recording or a sign-up.

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
