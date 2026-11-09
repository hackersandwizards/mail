# Performance, 09.11.2026

Re-measured the catalog on the Mac (Apple Silicon, Bun 1.4.4, Chrome for Testing 156) on servers this
run started on free ports, on commit `ec596f6` (v1.2.15 with scaffolding v5.5.1 and admin v1.20.1). Other sessions ran
on the same machine. The Lighthouse batch waited up to five minutes for the 1-minute load to reach
the 16 cores or fewer, and the load sits beside every number as 1, 5 and 15 minutes.

No fix was needed: every page type still scores 100 on performance, mobile and desktop, and this
polish changed no code a page or a mail runs. Only Lighthouse ran again. The sections from Navigation
down are the v1.2.13 measurements of 08.11.2026 and date from that build: the catalog shell has moved
since (scaffolding v2.21.2 to v5.5.1, brand v1.38.0 to v1.64.0), and they were not repeated.

## Lighthouse 13.6.0, production build, median of three

The build was served as GitHub Pages serves it, under `/mail` with gzip and
`Cache-Control: max-age=600`, which matches the live site's header.

| Page                                  | Mobile | FCP   | LCP   | Desktop | Load at start, mobile / desktop       |
| ------------------------------------- | ------ | ----- | ----- | ------- | ------------------------------------- |
| Catalog home                          | 100    | 1.1 s | 1.1 s | 100     | 16.69 15.45 14.31 / 11.16 14.23 13.91 |
| Story in the dashboard (Brief, light) | 100    | 0.9 s | 1.3 s | 100     | 10.32 13.78 13.76 / 15.48 14.76 14.12 |
| Rendered mail, `/mails/brief.html`    | 100    | 0.6 s | 0.6 s | 100     | 11.47 13.87 13.82 / 9.43 13.13 13.55  |

On 08.11. the same three pages read FCP 1.4, 0.8 and 0.6 s and LCP 1.4, 1.4 and 0.6 s, at a load of 3
to 4 (v1.2.13). The story frame was not run again: Lighthouse cannot score it, as below.

All three runs scored the same on every page. TBT is 0 ms and CLS 0 on all but one run; one mobile run of the rendered mail had a TBT of 10 ms.

- **Story frame: Lighthouse cannot score it.** The page's only content is the mail in a `srcdoc`
  iframe, and Chrome counts no paint inside an iframe toward the page's first contentful paint, so
  Lighthouse stops with `NO_FCP`. Control: the same file with a single `<p>x</p>` before the iframe
  scores 100 with an FCP of 0.8 s (one run each form factor). The mail the frame shows is the
  rendered mail above, which scores 100. Nobody waits on this, so nothing changed.
- **SEO 60 to 63** on the catalog pages: `noindex`, which scaffolding's catalog sets on purpose.
- **Rendered mail: accessibility 97, best practices 92, SEO 90.** No `<main>` landmark, the XHTML
  1.0 Transitional doctype and no meta description: all three are mail conventions React Email
  writes on purpose. The console error is a 404 for `/favicon.ico` at the host root, which a mail
  never links. It is a 404 on the live host as well (`https://hackersandwizards.github.io/favicon.ico`),
  and the site root is not this repository's.
- Smaller findings that cost no points: the home's preview of the Brief with image scales brand's
  512 px icon to 152 px (5.8 KB to save), and the catalog's stylesheets block render for an
  estimated 140 to 150 ms on mobile. Both sit within a 100 score.

## Navigation and interaction, headless Chrome, median of five

Unthrottled, viewport 1366x900, a fresh profile per run, load 3.60 at the start and 3.79 at the end.

| Step                                     | Median | Runs               |
| ---------------------------------------- | ------ | ------------------ |
| Home to load event                       | 80 ms  | 73, 77, 80, 81, 92 |
| Search: one keystroke to the next frame  | 12 ms  | 9, 12, 12, 13, 17  |
| Home to a story (tile click, mail shown) | 20 ms  | 19, 19, 20, 20, 21 |
| Story to its dark state (sidebar)        | 19 ms  | 19, 19, 19, 19, 19 |
| Story to the other mail (sidebar)        | 19 ms  | 19, 19, 19, 20, 21 |
| Rendered mail in a cold tab              | 8 ms   | 7, 7, 8, 8, 30     |

The sidebar links load the whole page rather than going through the client router; at 19 ms that
costs nothing visible.

## Startup

Launch to the first 200, three runs each:

- `bun --bun astro dev --ignore-lock` from `catalog/`, that is `bun run dev` plus the flag, served at
  the root: 892, 803, 845 ms (load 3.38 to 3.51).
- `astro preview --ignore-lock`: 391, 392, 386 ms (load 3.51). There is no `preview` script; the
  catalog deploys as static files.
- `bun run build`, whole process, 37 pages: 1.84 s on the first run with a cold Vite cache, then
  817, 871, 886 ms (load 3.6).

## The engine

This package serves no endpoints; os calls it as the `mail-render` command, once per mail, from its
`customer-update` skill. Load 3.60 at start and at the end.

| Call                                         | Time                     |
| -------------------------------------------- | ------------------------ |
| `mail-render brief.json --out`, fresh        | 202, 198, 198 ms         |
| importing `scripts/render.ts`                | 165 ms                   |
| `renderBrief`, first call in a process       | 13.6 ms                  |
| `renderBrief`, kept, 100 calls, Brief        | p50 0.23 ms, p95 0.51 ms |
| `renderBrief`, kept, 100 calls, Brief + Bild | p50 0.18 ms, p95 0.30 ms |

The fresh command's output is byte-identical to the catalog's `dist/mails/brief.html`.

Of the 165 ms import, about 150 ms is React Email's code block. `react-email` 6.11.8 exports one
barrel; it imports every component, and `CodeBlock` evaluates 637 KB of Prism grammars at import.
No mail here uses a code block. Controls, two runs each: importing `react-email` takes 158 to 163 ms,
`dist/components/code-block/code-block.mjs` alone 147 to 152 ms, `@react-email/render` alone 14 ms,
Tailwind 16 to 17 ms, `body.mjs` 3 ms.

Not changed here, for three reasons. The package's `exports` names only the barrel, so a deep import
leaves its public surface. The standalone `@react-email/*` component packages are deprecated on npm.
Copying the eight components into this repository would trade 150 ms per command for code that no
longer follows upstream fixes. A kept process pays the cost once, and os pays it once per mail an
agent renders. It becomes worth acting on if os imports `renderBrief` into a server that starts
often, or if React Email ships per-component exports or loads Prism lazily.

## Open in other repositories

None. Every score in this report is 100 or explained by an intentional setting, and the one cost
found belongs to React Email, outside the company.
