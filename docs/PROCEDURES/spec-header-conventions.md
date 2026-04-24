# Spec Header Conventions

Canonical form for spec header labels parsed by the ZiLin router
(`.github/workflows/zilin-queue.yml`, the "Resolve target repo and mode"
step). An issue filed against `zi007lin/zai` that kicks off an impl
dispatch must include a repo header that matches one of the accepted
labels below.

## Canonical label

```
**Repo:** <owner>/<name>
```

Example:

```
**Repo:** zi007lin/htu-foundation
```

Either the bare slug (`zi007lin/htu-foundation`) or a backtick-wrapped
slug (`` `zi007lin/htu-foundation` ``) is accepted.

## Accepted aliases

The router accepts the following aliases to reduce friction on
human-authored specs. When an alias is matched instead of the canonical
form, the router logs a `::warning::` recommending a move to `**Repo:**`.
Aliases may be removed after a deprecation window; treat the canonical
label as the long-term stable contract.

| Priority | Label              | Status     |
|---------:|--------------------|------------|
| 1        | `**Repo:**`        | canonical  |
| 2        | `**Target repo:**` | alias      |
| 3        | `**Target:**`      | alias      |
| 4        | `**Canonical repo:**` | alias   |
| 5        | `**For repo:**`    | alias      |

## Parsing rules

- Matching is case-insensitive.
- Labels must appear in markdown-bold form (`**...:**`).
- The router scans the issue body top-to-bottom and accepts the first
  match in priority order (canonical first). If the canonical label is
  present anywhere in the body, it wins over any alias.
- Repo slugs must match `[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+`. Anything
  outside that character set is not recognized as a slug.
- The resolved repo must appear in the router allow-list in
  `.github/workflows/zilin-queue.yml`. Resolving to an out-of-list repo
  is treated as a failure regardless of how the label was written.

## Failure mode

If neither `client_payload.target_repo` nor any accepted header label
resolves, the router emits a diagnostic block to the step log listing:

- The payload field tried (`client_payload.target_repo`) and that it
  was empty
- The accepted header labels in priority order
- The first ten lines of the issue body, numbered
- The `client_payload` keys actually present
- A pointer back to this document

That block is the intended self-service path — an author who hits the
failure should be able to fix the spec header and re-dispatch without
reading workflow source.

## Examples

Accepted:

```
**Repo:** zi007lin/htu-foundation
```

```
**Target repo:** `zi007lin/streettt`
```

```
**canonical repo:** zi007lin/zai
```

Not accepted (slug outside allowed character set):

```
**Repo:** zi007lin/my repo with spaces
```

Not accepted (label not in markdown-bold):

```
Repo: zi007lin/htu-foundation
```

Not accepted (label not recognized):

```
**Destination:** zi007lin/htu-foundation
```
