---
kind: work
status: open
priority: 2
owner: Poppy
area: software-engineering
evidence: "`docs/agent-work/2026-11-13-performance.md`, read 13.11.: `renderBrief`, first call in a process, 23.5 to 25.8 ms over 7 processes on 13.11. against 12.5 ms on 11.11. The same bench on the source of `5311b11` and on the build of 13.11., same `node_modules`, back to back three times, read 22.7 to 25.9 ms and 23.5 to 24.4 ms."
---

# The engine's first render reads twice the time of 11.11. and the cause is not explained

Poppy finds why the first `renderBrief` call in a process takes about 24 ms where 11.11. read 12.5 ms.

The performance report of 13.11. measures the first render in a fresh process at 23.5 to 25.8 ms.
The report of 11.11. gave 12.5 ms. The kept render, the fresh command and the Lighthouse scores
match 11.11.

What is ruled out: the code of the window. The source from before v2.0.11 reads the same first call
as the build of 13.11. when both run against the same `node_modules`.

What is not ruled out, each one factor to change in a control:

- **The method.** The bench script of 11.11. is not on record, so the two figures may time different
  spans, such as with or without the import.
- **The dependencies.** Both runs of 13.11. shared one `node_modules`. A run on the lockfile of
  11.11. would show whether a raised package is the cost.
- **The machine's load.** The report gives a load of 12 to 15 beside the bench of 13.11. and of 15
  beside the build of 11.11., on 16 cores. That speaks against it and does not exclude it.

Keep both readings in the report until a control shows the cause. Then either the 11.11. figure is
corrected as a different measurement, or the regression has a name and a fix.

Done when the report states the cause with the control that showed it, and the bench script sits in
the repository so the next reading uses the same method.
