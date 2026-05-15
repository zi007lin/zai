# Some general title that does not start with a recognised type token

This document has no canonical filename prefix, no H1 that starts with
one of the known type tokens (feat / bug / spec / chore / refactor /
research / hotfix / ux / brand / epic), and no YAML frontmatter
`spec_type:` field. Uploading it should trigger the detector's final
`SpecTypeError`, which the web UI catches and surfaces as an in-UI red
banner with remediation guidance — never as `Uncaught (in promise)`.
