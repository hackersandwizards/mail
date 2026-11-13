# Git hooks

`bun install` points `core.hooksPath` here for this clone, never in user-global git config. Every
file here but this README is scaffolding's skeleton, held identical to the pinned version by
`check-structure`: change it in scaffolding. `check-lock.ts` is the skeleton's copy of `check-lock`,
so `install` takes the lock before `node_modules` exists.

| Hook            | Trigger                                                                         | Runs                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pre-commit`    | every commit                                                                    | `bun run check:staged`: scaffolding's `check-staged`, below                                                                                                                                            |
| `commit-msg`    | every commit                                                                    | `check-confidential` on the message                                                                                                                                                                    |
| `pre-push`      | every push                                                                      | `check-confidential prepush`: refuses commits purged from history, then hands the refs to Git LFS where the push may carry LFS objects; then `bun run check --changed` over each pushed branch's range |
| `post-merge`    | a merge that changed `bun.lock` or `package.json`                               | `install`; git ignores a post-merge hook's exit status, so a failure never fails the merge                                                                                                             |
| `post-checkout` | a branch checkout that changed `bun.lock` or `package.json`, and a new worktree | `install`; the checkout's exit status stays its own                                                                                                                                                    |
| `install`       | the two hooks above, `session-start` and `.mcp.json`'s chrome-devtools server   | `bun install --frozen-lockfile` under `check-lock`, never waiting behind a gate or a build, only behind another install; a skip or a failure is named on stderr                                        |
| `session-start` | the SessionStart hook in `.claude/settings.json`                                | fetches `origin main` within 20 s; on the Mac says how far `origin/main` is ahead and moves no branch, in a cloud session switches to `main` and fast-forwards it to `origin/main`; then `install`     |

`check:staged` runs `check-staged` from `@hackersandwizards/scaffolding`: `gitleaks` on the index,
`check-coupling` and `check-confidential`, `check-licenses` where `bun.lock` or `package.json` is
staged, `admin-check` where an item is staged, then `prettier --check`, `eslint` and `stylelint` on
the staged files. A missing `bun`, `gitleaks`, `prettier` or `eslint` fails the commit closed:
`brew install gitleaks`, `bun install`.
