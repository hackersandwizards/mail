---
kind: work
status: open
priority: 2
owner: Poppy
area: software-engineering
evidence: "`components/Paragraph.tsx` line 14 and `briefText` in `mails/Brief.tsx`, v2.0.12. Probed again on 13.11. with the catalog brief and a line break appended to its greeting: the text part holds two blank lines after the greeting where the catalog brief holds one, and the HTML part ends the paragraph on a `<br/>` that shows no line. The three variants below are the polish review's readings of 13.11. and were not run again."
---

# A line break ending a printed field adds a blank line to the text part only

Poppy picks refusal or a per-field trim for a break that ends a printed field, with a red-first test.

A field that ends in a line break renders differently in the two parts of the mail. The HTML part
closes the paragraph on a `<br>`, which shows nothing. The text part writes the break and then the
blank line between blocks, so the reader of the text part sees one blank line more. A YAML block
scalar (`|`) keeps its final newline, so a data file written that way sends this input.

The review of 13.11. read three more cases of the same kind:

- A label ending in a break moves the colon and the title onto a line of their own.
- `closing` gets a blank line in both parts.
- `linkText` ending in a break starts the next text line with the address in brackets.

A trim of every field is wrong. In `objection.before` and `linkText` a break at the field's end sits
inside the sentence and already reads the same in both parts. So the fix is one of two:

- **Refuse:** `checkBrief` rejects a break at the end of the fields it names. That narrows the input
  and belongs in a release whose commit says so.
- **Trim:** the engine drops a final break in the fields it names, and the README lists them.

The doc comment no longer claims the two parts agree here. No consumer is known to send such a
field today, which is why the polish run left the choice to the next session that cuts a release.

Done when a test that was red on a trailing break is green and the README states the behaviour.
