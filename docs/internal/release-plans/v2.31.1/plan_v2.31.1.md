# v2.31.1 Release Plan: Maintenance patch (CI trust + dependency security drain)

**Status:** **SHIPPED 2026-07-31** (tag `v2.31.1`; G2.5-captured SHA recorded at G4; G1 Codex adversarial review run 2026-07-31, one medium finding remediated in-cycle: the notes page briefly published pre-tag, drafted at `04ce8b6e`, un-drafted in the release-prep commit).
**Owner:** Maintainers
**Type:** **PATCH** (CI reliability fixes, dependency security updates, and site-build repairs; no skill behavior change, no new skill; catalog stays 30 phase + 11 foundation + 12 utility + 15 tool = 68 skills, 6 sub-agents, 11 commands, 12 workflows).
**Theme:** Restore trust in the merge pipeline and drain the security queue. A required-check misconfiguration had silently deadlocked every site-only PR for three weeks (nine PRs, ten open Dependabot alerts, four high). This patch ships the unblock, the drained queue (alerts 10 to 0), two latent-fragility fixes the drain surfaced, and one validator race fix. It also serves as the first S1 shadow exit-gate observation for the zero-drift program (ZD-4): this manual cut is diffed against release-please's shadow PR #237.
**Created:** 2026-07-30
**Previous:** v2.31.0 SHIPPED 2026-07-06 (zero-drift releases + the improvement program; tag `fa0111e8`).

---

## Where we are

v2.31.0 stood up release-please in shadow behind a PR-title lint and made generation the only write path for the derived surfaces. Its post-tag window then surfaced an unrelated CI trap: `validate-plugin` is a required status check, but its workflow carried a `paths:` filter, so any PR not touching plugin paths could never report the check and sat `BLOCKED` forever with all-green visible checks. Eight Dependabot PRs (and the queue behind them) accumulated against that wall from 2026-07-05 to 2026-07-30.

The 2026-07-29/30 review found the root cause, fixed it, drained the queue, and repaired the two latent defects the drained bumps exposed (a transitive dependency the site config silently relied on, and a schema shadow that emptied the whole route collection under Starlight 0.41.4+). A separate nondeterministic validator failure (SIGPIPE under pipefail) hit main mid-drain and was fixed the same day. Full narrative evidence lives in the PR bodies (#244, #246) and the S1 findings comment on #237.

This is a focused maintenance PATCH in the v2.25.1 / v2.27.1 / v2.29.1 precedent line.

## Scope - what v2.31.1 ships

All items are already merged to main; this plan documents the release cut.

| Item | PR(s) | Disposition |
|---|---|---|
| **README version badge generator-owned** | #228 | **SHIPPED here.** Drops the lossy annotation path; the badge is now written only by `gen-derived-surfaces` (closes the release-please README corruption found at the v2.31.0 S1 observation, issue #136). |
| **validate-plugin required-check deadlock fix** | #244 | **SHIPPED here.** The `pull_request` trigger's `paths:` filter is removed so the required check always reports. A workflow comment documents the constraint. |
| **Dependency security drain** | #243, #241, #242, #234, #231, #245, #240, #233, #247, #211, #239, #230 | **SHIPPED here.** Open Dependabot alerts 10 (4 high) to 0. Includes astro 7.0.2 to 7.1.6, starlight 0.41.0 to 0.41.5, sharp, svgo, dompurify, postcss, astro-mermaid, js-yaml (root, dev), transitive js-yaml in `.github/scripts` (lockfile-only; no Dependabot PR existed), and CI actions checkout v7 / setup-node v7 / release-please-action v5 (runtime-only change, verified zero input changes). |
| **Site build: declare `@astrojs/markdown-remark`** | #240 | **SHIPPED here.** Astro 7.1 stopped bundling it; the deprecated `markdown.remarkPlugins` keys hard-fail config validation without it. Declared as a direct dependency with a call-site comment; deliberately stays on the legacy keys because astro-mermaid injects through them. |
| **Site build: stop shadowing docsSchema `draft`** | #233 | **SHIPPED here.** The extend schema re-declared `draft`, which under Starlight 0.41.4+ merge fixes emptied the entire route collection in production builds. One-line removal plus a guard comment: extend is for new fields only. |
| **AGENTS.md sync validator SIGPIPE fix** | #246 | **SHIPPED here.** `printf | grep -q` under `set -o pipefail` nondeterministically reported present entries as missing (fired on main at `c33e5f2d`, PowerShell leg green on identical content). Replaced with a pure-bash membership loop; negative-tested. |
| **Apache-2.0 copyright owner** | #236 | **SHIPPED here.** License hygiene; no functional change. |
| **ADR format divergence recorded** | #238 | **SHIPPED here.** Documentation of external audit finding EC-1. |

## Open decisions

| # | Decision | Status |
|---|---|---|
| D1 | Version is **v2.31.1 (PATCH)**, not v2.32.0 | DECIDED. CI/tooling/deps/docs only; no skill surface change. SemVer tracks compatibility, not significance (v2.27.1 D1 precedent). |
| D2 | **G1 codex adversarial review RUN** (waiver proposed, maintainer declined it) | DECIDED. The waiver case (v2.27.1 D2 precedent) was presented at the G1 prompt; the maintainer chose to run the review instead. Codex companion `adversarial-review --base v2.31.0 --scope branch`, 2026-07-31: verdict needs-attention, one medium finding (the release notes page published on Pages claiming a released v2.31.1 before any tag or version surface existed). Remediated in-cycle: page drafted at `04ce8b6e` closing the live claim, un-drafted inside the release-prep commit; convergence re-run against the release-prep SHA before G3 per the reviewer's next steps. |
| D3 | **This cut is the ZD-4 S1 exit-gate observation** | DECIDED. The manual 6-gate cut is diffed against shadow Release PR #237 at G2.5/G4. Findings pre-recorded 2026-07-30 in the [#237 S1 evidence comment](https://github.com/product-on-purpose/pm-skills/pull/237#issuecomment-5135342843): version matches (2.31.1); shadow notes carry only the visible fix-type entries (hybrid enrichment per ZD-1 remains manual); marketplace `source.ref` desync and JSON reformatting corruption remain open S1 findings; CHANGELOG placement diverges from house Keep-a-Changelog order. S1 to S2 promotion is NOT ruled here (maintainer-only per the cutover checklist). |

## Release surfaces (G2)

- `CHANGELOG.md`: `## [2.31.1] - 2026-07-30` (Fixed + Changed + Security).
- `site/src/content/docs/changelog.md`: curated one-paragraph `[2.31.1]` mirror.
- `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (version + `source.ref`), `.codex-plugin/plugin.json`: `version` 2.31.0 to 2.31.1.
- `.release-please-manifest.json`: `2.31.0` to `2.31.1` (keeps the shadow instance honest; v2.31.0 G4 precedent).
- Derived surfaces regenerated via `node scripts/gen-derived-surfaces.mjs` (README badges + catalog blocks, quickstarts, compatibility matrix, manifest description headlines, release-notes mirrors).
- Release notes: `site/src/content/docs/releases/Release_v2.31.1.md`.
- This plan: status flipped to SHIPPED at G4.

## Gate checklist

- [ ] G0 pre-tag readiness (validator bundle pwsh, em-dash sweep, counters, inline cross-cutting audit, required files)
- [ ] G1 maintainer attestation (D2 waiver rationale presented at prompt)
- [ ] G2 version bump + CHANGELOG prep (surfaces above; inline curator flow; hidden-comment leak check)
- [ ] G2.5 commit `chore(v2.31.1): release-prep edits for v2.31.1`, re-verify against new HEAD, push, CI green, SHA captured; S1 diff vs #237 recorded
- [ ] G3 annotated tag on the G2.5-captured SHA; maintainer "ship it"; push
- [ ] G4 post-tag hygiene: install-path smoke test (P0), marketplace resolution (P1), Pages rebuild (P1), Release UI body (P2), next-cycle stub (P2), S1 evidence recorded + #237 reconciliation noted
