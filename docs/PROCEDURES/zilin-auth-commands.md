# ZiLin Auth Commands

ZiLin provides three commands for managing dual GitHub accounts during
HTU's solo-operator phase. All three wrap standard `gh` CLI calls and,
where appropriate, append to a role-transition audit log.

| Command | Purpose |
|---|---|
| `zilin auth login-second` | Add a second GitHub account to the local `gh` CLI for role-simulation |
| `zilin auth swap <user> [--reason "<text>"]` | Switch the active account, logging the transition |
| `zilin auth whoami` | Show the current account and recent role transitions |

## `zilin auth login-second`

Wraps `gh auth login --hostname github.com` to add a second GitHub
account to the local `gh` CLI installation. Before launching the OAuth
flow, prints a reminder explaining that the second account is being
added for role-simulation between the author role (`zi007lin`) and the
approver role (`daniel-silvers`). After the OAuth flow completes, runs
`gh auth status` so the operator sees both accounts and which one is
currently active.

## `zilin auth swap <user> [--reason "<text>"]`

Wraps `gh auth switch -h github.com -u <user>` to change the active
account. After the swap succeeds, appends one line to a role-
transition audit log:

```
2026-04-24T15:32:11Z swap from=zi007lin to=daniel-silvers reason="approving PR #73"
```

The `--reason` flag is optional. When omitted, the audit log records
`reason="(none provided)"` rather than failing.

The audit log is created on first invocation of any auth command with
permissions `600` (owner read/write only). Its location is configured
via the `ZILIN_AUTH_AUDIT_LOG` environment variable; when unset, a
sensible default under the operator's home directory is used.

## `zilin auth whoami`

Wraps `gh auth status` to show the current active account, then prints
the last five lines of the audit log so the operator can see recent
role transitions in one view. If no transitions have been recorded
yet, prints a hint pointing to `zilin auth swap`.

## Role-simulation context

**Role-simulation context:** HTU's dual-control governance model
assigns distinct roles to zi007lin (author) and daniel-silvers
(approver). During the solo-operator phase — when one human fills both
roles — these commands switch which gh CLI account is active for the
role currently being performed. The audit log records role transitions
for operational continuity. When daniel-silvers becomes a separate
human, they log in independently on their own machine, and `zilin auth
swap` ceases to be invoked. No other workflow changes are needed at
that transition — branch protection, review requirements, and PR-merge
mechanics already match the target state.
