# Git hooks

`bun install` points `core.hooksPath` here for this clone, never in user-global git config.

| Hook            | Trigger                                                                       | Runs                                                                                                            |
| --------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `pre-commit`    | every commit                                                                  | `bun run check:staged`: scaffolding's `check-staged`, below                                                     |
| `commit-msg`    | every commit                                                                  | `check-confidential` on the message                                                                             |
| `pre-push`      | every push                                                                    | `check-confidential prepush`: refuses commits purged from history                                               |
| `post-merge`    | a merge that changed `bun.lock` or `package.json`                             | `install`, whose exit status the merge reports                                                                  |
| `post-checkout` | a branch checkout that changed `bun.lock` or `package.json`                   | `install`; the checkout's exit status stays its own                                                             |
| `install`       | the two hooks above, `session-start` and `.mcp.json`'s chrome-devtools server | `bun install --frozen-lockfile` under `check-lock` without waiting; a held lock or a failure is named on stderr |
| `session-start` | the SessionStart hook in `.claude/settings.json`                              | fetches `origin main` within 20 s, says how far `origin/main` is ahead, moves no branch, then `install`         |

`check:staged` runs `check-staged` from `@hackersandwizards/scaffolding`: `gitleaks` on the index, `check-coupling` and `check-confidential`, then `prettier --check` and `eslint` on the staged files. A missing `bun`, `gitleaks`, `prettier` or `eslint` fails the commit closed: `brew install gitleaks`, `bun install`.
