---
kind: work
status: open
priority: 3
owner: Benedikt
evidence: not established
---

# Check the Brief in Outlook.com dark mode and classic Outlook

Send the catalog Brief to an Outlook.com mailbox and open it in classic Outlook on Windows, then
report three readings. No Outlook engine runs on the Mac this repository is built on: classic
Outlook's Word engine runs only on Windows, and sending a test mail or using a paid render service
needs a person's go.

1. **Outlook.com, dark mode:** do the name, contact line and item titles show the mail's own dark
   colours (`[data-ogsc]` rules in `components/MailShell.tsx`), or Outlook.com's? Sources disagree:
   hteumeuleu's 2019 article, edited 15.10.2019, says Outlook.com adds inline `!important` to every
   style it edits, so "It’s no longer possible to override Outlook.com’s dark mode styles"; newer
   guides found by search in November 2026 still recommend the selector, and none names a test. If
   Outlook.com's colours win, the block is 2 KB that does nothing and goes.
2. **Classic Outlook, column width:** does the column stay at 600 px? React Email's `Container` sets
   `max-width` only, which email vendors' guides say classic Outlook ignores. If it spans the pane,
   the fix is a conditional (`<!--[if mso]>`) table of 600 px around it.
3. **Classic Outlook, dark mode:** does the forced inversion look like the catalog's Inverted story?
