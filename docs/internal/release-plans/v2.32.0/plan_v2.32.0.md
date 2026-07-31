# v2.32.0 Release Plan: STUB (next-cycle candidates)

**Status:** STUB (created at v2.31.1 G4 post-tag hygiene, 2026-07-31; no scope committed).
**Owner:** Maintainers
**Type:** TBD (MINOR expected if any staged workstream ships).
**Previous:** v2.31.1 SHIPPED 2026-07-31 (maintenance patch; tag `v2.31.1` at `32e28377`).

## Candidate scope (staged workstreams, in issue order)

Carried from the v2.31.0 improvement program; none started. Sequencing and selection are open decisions.

| Candidate | Tracking issue | One-line scope |
|---|---|---|
| Memory artifact ledger (F-48) | [#223](https://github.com/product-on-purpose/pm-skills/issues/223) | Durable per-project artifact ledger surfaced to skills |
| Typed handoff envelope (R-23) | [#224](https://github.com/product-on-purpose/pm-skills/issues/224) | Structured skill-to-skill handoff contract |
| Coverage offense C3 AI-product (R-22 family) | [#225](https://github.com/product-on-purpose/pm-skills/issues/225) | AI-product skill family coverage expansion |
| Eval completion tail (R-21) | [#226](https://github.com/product-on-purpose/pm-skills/issues/226) | Trigger-fixture roster completion beyond 43/68 |

## Carried follow-ups from v2.31.1

- Runbook doc fix (P3, G0 audit): `site/src/content/docs/contributing/release-runbook.md` G0 sub-check 4 references retired `_agent-context/claude/CONTEXT.md`; update to the current context-surface list.
- `lint-skills-frontmatter.sh` carries the `pipefail` + `printf | grep -q` idiom fixed in `validate-agents-md.sh` (#246); small piped producers so unobserved in practice, convert opportunistically.
- Dependabot `groups:` config for `/site` npm updates (one grouped PR instead of eight serial rebases; friction observed 2026-07-30).
- PR-title lint promotion (advisory to enforcing) per the S2 cutover checklist; 2026-07-30/31 produced a clean conventional-title sample, but see the title-discipline data point in the v2.31.1 S1 record (release-prep housekeeping commits should be `chore:`-typed).
- S2 cutover fallback note: manifest-ahead-of-tag makes release-please propose a phantom minor (observed as the #237 2.32.0 flip during the v2.31.1 pre-tag window; details in `../v2.31.1/plan_v2.31.1.md`, S1 record).
