# Performance, 11.11.2026

Measured on the Mac (Apple Silicon, 16 cores, Bun 1.4.4, Chrome for Testing 157.0.8103.50) on servers
this run started on free ports, on the build of v2.0.6 with this polish's fixes, released as v2.0.7
(brand v2.15.0, scaffolding v5.17.1, react-email 6.11.11). Other sessions ran on the same machine: each
batch waited until the 1-minute load was at or under the 16 cores, and the load stands beside every
series as 1, 5 and 15 minutes.

No fix was needed. Every page type scores 100 on performance, mobile and desktop, and the engine's
times are those of 08.11. within the spread of a loaded machine.

## Lighthouse 13.6.0, production build, three runs each

The build was served as GitHub Pages serves it, under `/mail` with gzip and
`Cache-Control: max-age=600`, the headers the live site answered with on 11.11.

| Page                                  | Mobile | FCP   | LCP   | Desktop | FCP    | LCP    | Load at start, mobile / desktop       |
| ------------------------------------- | ------ | ----- | ----- | ------- | ------ | ------ | ------------------------------------- |
| Catalog home                          | 100    | 0.9 s | 0.9 s | 100     | 0.26 s | 0.26 s | 16.65 12.74 11.77 / 14.01 12.45 11.70 |
| Story in the dashboard (Brief, light) | 100    | 0.9 s | 1.2 s | 100     | 0.24 s | 0.32 s | 13.33 12.50 11.74 / 10.33 11.87 11.54 |
| Rendered mail, `/mails/brief.html`    | 100    | 0.6 s | 0.6 s | 100     | 0.17 s | 0.17 s | 8.47 11.29 11.34 / 11.88 11.92 11.58  |

FCP and LCP are the median of the three runs. All three runs scored 100 on every page. CLS is 0 on
every run and TBT 0 ms on all but one mobile run of the rendered mail (47 ms). On 09.11. the same
pages read a mobile FCP of 1.1, 0.9 and 0.6 s and an LCP of 1.1, 1.3 and 0.6 s (v1.2.15, load 10 to
17).

- **Story frame: Lighthouse cannot score it.** The page's only content is the mail in a `srcdoc`
  iframe, and Lighthouse stops with `NO_FCP` (one mobile run, load 14.42). The mail the frame shows
  is the rendered mail above.
- **Catalog pages: 100 on accessibility, best practices and SEO.** SEO read 60 to 63 on 09.11.,
  when the shell set `noindex`. The built pages carry no robots tag now, so the catalog is
  indexable.
- **Rendered mail: accessibility 97, best practices 92, SEO 90.** No `<main>` landmark, the XHTML
  1.0 Transitional doctype and no meta description: mail conventions React Email writes on purpose.
  The console error is a 404 for `/favicon.ico` at the host root, which a mail never links; the live
  host answers 404 there too (`https://hackersandwizards.github.io/favicon.ico`), and the site root
  is not this repository's.
- Insights that cost no points, on the home: its two stylesheets block render for an estimated
  290 ms on mobile (`elements.css`, 22 KB gzipped, and `app.css`, 2 KB), and the preview of the
  Brief with image scales brand's 512 px icon to 152 px (5.8 KB to save).

## Startup

- `bun run build`, whole process, 41 pages: 1,272 ms on the first run, then 845 and 849 ms (load
  15.03 15.50 13.21).
- `bun --bun astro dev --ignore-lock --port <free port>` from `catalog/`, launch to the first 200
  at the root: 1,020, 939 and 964 ms (load 15.43 15.57 13.25). On 08.11. it took 803 to 892 ms at a
  load of 3.4.

## The engine

This package serves no endpoints; a consumer calls it as the `mail-render` command, once per mail.
Load 16.82 15.84 13.29 at the start and 16.75 15.84 13.30 at the end.

| Call                                         | Time                     |
| -------------------------------------------- | ------------------------ |
| `mail-render brief.json --out`, fresh        | 210, 167, 177 ms         |
| importing `scripts/render.ts`                | 182, 178, 161 ms         |
| importing `react-email`                      | 160, 155, 156 ms         |
| `renderBrief`, first call in a process       | 12.5 ms                  |
| `renderBrief`, kept, 100 calls, Brief        | p50 0.24 ms, p95 0.43 ms |
| `renderBrief`, kept, 100 calls, Brief + Bild | p50 0.20 ms, p95 0.30 ms |

The fresh command's output is byte-identical to the catalog's `dist/mails/brief.html`.

The import is React Email's: `react-email` 6.11.11 exports one barrel, which imports every
component, and its code block alone (`dist/components/code-block/code-block.mjs`) took 133 and
155 ms in two runs. No mail here uses a code block.

Not changed here, for three reasons. The package's `exports` names only the barrel, so a deep import
leaves its public surface. The standalone `@react-email/components` package is deprecated on npm
(read 11.11.). Copying the components into this repository would trade 150 ms per command for code
that no longer follows upstream fixes. A kept process pays the cost once. It becomes worth acting on
if a consumer imports `renderBrief` into a server that starts often, or if React Email ships
per-component exports or loads its code block lazily.

## Not repeated

The navigation and interaction timings of 08.11. (medians of 8 to 80 ms a step, on v1.2.13) were not
measured again: no step there was near a threshold a person notices.
`git log -- docs/agent-work/2026-11-09-performance.md` holds them.
