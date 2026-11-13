# Performance, 13.11.2026

Measured on the Mac (Apple Silicon, 16 cores, Bun 1.4.4, Chrome for Testing 157.0.8103.50) on a
server this run started on a free port, on the build of v2.0.12 with this polish's fixes (brand
v2.24.0, scaffolding v5.24.2, react-email 6.11.11). Other sessions ran on the same machine: the run
waited until the 1-minute load was at or near the 16 cores, it rose to 19 during some series, and the
load stands beside every series as 1, 5 and 15 minutes.

No fix was needed. Every page type scores 100 on performance, mobile and desktop, and every
Lighthouse reading matches 11.11. (v2.0.7, brand v2.15.0, scaffolding v5.17.1) within a few
milliseconds. The engine's first render in a process reads about twice the 11.11. figure, see below.

## Lighthouse 13.6.0, production build, three runs each

The build was served as GitHub Pages serves it, under `/mail` with gzip and
`Cache-Control: max-age=600`.

| Page                                  | Mobile | FCP   | LCP   | Desktop | FCP    | LCP    | Load at start, mobile / desktop       |
| ------------------------------------- | ------ | ----- | ----- | ------- | ------ | ------ | ------------------------------------- |
| Catalog home                          | 100    | 0.9 s | 0.9 s | 100     | 0.24 s | 0.24 s | 16.10 22.52 19.49 / 15.94 21.84 19.34 |
| Story in the dashboard (Brief, light) | 100    | 0.9 s | 1.2 s | 100     | 0.24 s | 0.32 s | 16.89 21.25 19.22 / 13.44 20.01 18.84 |
| Rendered mail, `/mails/brief.html`    | 100    | 0.6 s | 0.6 s | 100     | 0.16 s | 0.16 s | 13.80 19.42 18.66 / 18.48 20.05 18.91 |

FCP and LCP are the median of the three runs. All three runs scored 100 on every page. CLS is 0 on
every run, and TBT 0 ms on all but two mobile runs (21 ms on the home, 56 ms on the rendered mail).

- **Catalog pages: 100 on accessibility, best practices and SEO.**
- **Rendered mail: accessibility 97, best practices 92, SEO 90.** No `<main>` landmark, the XHTML
  1.0 Transitional doctype and no meta description: mail conventions React Email writes on purpose.
  The console error is a 404 for `/favicon.ico` at the host root, which a mail never links.
- Insight that costs no points, on the home: its two stylesheets (`app.css` and `elements.css`)
  block render for an estimated 240 ms on mobile (290 ms on 11.11.).

## Startup and the gate

- `bun run build`, whole process, 41 pages: 1,507, 1,151 and 1,656 ms (load 16.11 22.63 19.51), then
  1,290, 1,000 and 960 ms (load 12.11 14.17 16.33). On 11.11.: 1,272, 845 and 849 ms (load 15.03).
- `bun run check`: 11.0 s, green (load 13.22 15.55 13.27 at start).

## The engine

This package serves no endpoints; a consumer calls it as the `mail-render` command, once per mail.
Load 12.11 to 15.28.

| Call                                         | 13.11.                                   | 11.11.                   |
| -------------------------------------------- | ---------------------------------------- | ------------------------ |
| `mail-render brief.json --out`, fresh        | 200, 190, 200 ms                         | 210, 167, 177 ms         |
| `renderBrief`, first call in a process       | 23.5 to 25.8 ms (7 processes)            | 12.5 ms                  |
| `renderBrief`, kept, 100 calls, Brief        | p50 0.24 to 0.26 ms, p95 0.48 to 0.62 ms | p50 0.24 ms, p95 0.43 ms |
| `renderBrief`, kept, 100 calls, Brief + Bild | p50 0.21 to 0.22 ms, p95 0.33 to 0.52 ms | p50 0.20 ms, p95 0.30 ms |

The line-break handling of v2.0.11 and v2.0.12 costs nothing measurable: the same bench on the
source of `5311b11` (before it) and of this build, same `node_modules`, back to back three times,
read a first call of 22.7 to 25.9 ms before and 23.5 to 24.4 ms after, and the same kept times. Why
the first call reads about twice the 12.5 ms of 11.11. is not explained: the code is not it, and the
11.11. bench script is not on record to compare its method.

Most of a fresh command is the import of `react-email` 6.11.11, measured on 11.11. at 155 to 160 ms
of 161 to 182 ms for the whole `scripts/render.ts` import. It exports one barrel that imports every
component, its code block alone 133 to 155 ms, and no mail here uses a code block. Not changed: the
package's `exports` names only the barrel, the standalone `@react-email/components` package is
deprecated on npm (read 11.11.), and copied components would no longer follow upstream fixes. It
becomes worth acting on if a consumer imports `renderBrief` into a server that starts often, or if
React Email ships per-component exports or loads its code block lazily.

## Not repeated

`astro dev` startup (803 to 964 ms to the first 200 on 08.11. and 11.11.): the dev server is no
consumer's path. The navigation and interaction timings of 08.11. (medians of 8 to 80 ms a step, on
v1.2.13): no step there was near a threshold a person notices.
`git log -- docs/agent-work/2026-11-09-performance.md` holds them.
