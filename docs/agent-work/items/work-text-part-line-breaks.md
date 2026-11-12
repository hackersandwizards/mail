---
kind: work
status: open
priority: 3
order: 2102
area: software-engineering
owner: Ada
evidence: "Run polish-mail, 11.11. 21:18, report section 'Deferred, and why' (mail v2.0.10). The subject already refuses every kind of line break since that release."
---

# A line break in a greeting or item text reads differently in the HTML and the text part

Ada briefs the next mail session to make both parts of a mail read the same; it ends on a test with a control.

The HTML part folds a line break in the greeting or an item's text into a space; the text part
keeps it. One mail then reads two ways. This is an open defect, not a design choice. Refusing
breaks, as the subject now does, changes the data contract os writes against, so the session
decides between refusing them (and os adapting its writers) and rendering them the same in both
parts.

Done when a test sends a greeting and an item text with a break through both parts and both read
the same, and that test fails on today's code.
