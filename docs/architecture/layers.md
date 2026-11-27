# Layers

```mermaid
graph LR
  L0["."]
  L1["catalog"]
  L2["components"]
  L3["mails"]
  L4["scripts"]
  L5["test"]
  L1 -->|1| L0
  L1 -->|7| L2
  L1 -->|2| L4
  L3 -->|6| L2
  L4 -->|1| L2
  L4 -->|1| L3
  L5 -->|6| L1
  L5 -->|19| L2
  L5 -->|3| L3
  L5 -->|11| L4
```

## components

| Forbidden import                                                                             | Message                                                                                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `^(\./)*(\.\./)+(mails\|scripts\|catalog)(/\|$)\|^@hackersandwizards/mail/(mails/\|render$)` | `components/** cannot import from mails/, scripts/, catalog/, or @hackersandwizards/mail/(mails\|render). Pass composed content or data in as props from mails/, and keep shared tokens and helpers in components/ (such as components/theme.ts). Do not silence with oxlint-disable.` |

## mails

| Forbidden import                                                            | Message                                                                                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `^(\./)*(\.\./)+(scripts\|catalog)(/\|$)\|^@hackersandwizards/mail/render$` | `mails/** cannot import from scripts/, catalog/, or @hackersandwizards/mail/render. Keep mails/ as pure compositions over components/, move shared helpers or types into components/ or mails/, and leave rendering or preview logic in scripts/render.ts or catalog/. Do not silence with oxlint-disable.` |
