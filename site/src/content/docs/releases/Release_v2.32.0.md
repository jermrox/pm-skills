---
slug: releases/Release_v2.32.0
title: Release v2.32.0
description: Project memory lands as an opt-in state file eight skills read, trigger-eval fixture coverage closes as a 53-plus-15-equals-68 accounting, release automation gains the three mechanisms its cutover was missing, and the AI-product skill family gets a tracked scope spec with a control-arm build gate.
---

**Released 2026-08-14.** Additive MINOR. No new skills; catalog stays 68 skills (30 phase + 11 foundation + 12 utility + 15 tool), 6 sub-agents unchanged.

## The short version

Every release before this one added capability you invoke. This one adds capability that accumulates.

A skill invocation has always started from zero. You paste the same personas, restate the same initiative, re-explain which phase you are in. v2.32.0 introduces an opt-in state file that eight skills read, so the second skill in a session knows what the first one produced. Alongside it, trigger-eval coverage stops being a percentage and becomes an accounting, and the release-automation cutover gets the three mechanisms it was missing.

## What changed

### Project memory

Create `.claude/pm-skills.local.md` in your project, declare your Triple Diamond phase and current initiative, and two things happen. The `SessionStart` phase router stops guessing from your branch name and artifact layout and uses what you declared. And eight skills read the file as context: `discover-interview-synthesis`, `deliver-prd`, `foundation-okr-writer`, `iterate-retrospective`, and the four `foundation-meeting-*` skills.

The concrete moment: synthesize your research, then run the PRD skill. It uses the personas you already produced instead of asking you to paste them again.

The posture is opt-in throughout, deliberately. With no file, every skill and both hooks behave exactly as they did in v2.31.1. Writes are proposed for your confirmation rather than applied, with an opt-in flag if you want them automatic, and that flag fails closed. This project has spent two releases earning trust ground and is not spending it on a skill that writes into your repository without asking.

Two of the eight are pure readers by design. The meeting family already chains its artifacts by filename, so memory carries durable context there rather than duplicating a mechanism that works.

The full schema, including the `artifacts[]` entry shape and the four provenance tags, is documented in [Hooks and project memory](../concepts/hooks.md). Each of the six writing contracts also carries a **Write discipline** bullet: re-read immediately before writing, merge rather than overwrite, re-propose if the file changed in between. That page is equally plain about what this is not. It is an instruction the agent follows, not a runtime guarantee, because nothing normalizes or locks the file.

### Trigger-eval coverage closes

Ten more skills gain fixture packs at 20 queries each. The number that matters is not a coverage percentage: **53 skills carry a fixture pack and 15 are excluded by design, which accounts for all 68 with nothing unclassified.**

Being precise about what that claims, because it would be easy to overstate: carrying a fixture pack means the pack's structure is enforced on every pull request. It does not mean the skill's routing is continuously scored. The lane that actually scores recall and precision runs on manual dispatch, and its committed baseline covers 29 of the 53, so the other 24 have fixtures but are not yet drift-gated. Closing that gap is a later release's work, and the evals page states the current numbers rather than rounding them up.

The 15 are the sprint-family stages, which are entered through a family or workflow entry point rather than by typing a request. Measuring whether "run the magic lenses exercise" routes correctly measures a path users do not take. That exclusion is now recorded as data in the roster, with its counter-argument and reversal path written alongside it, and a new skill must land in exactly one of the two states in the merge that adds it.

Three collision pairs were declared along the way, taking the registered total from 22 to 25, and the reciprocal-pointer requirement forced shut a pre-existing one-sided edge.

### Release automation gets its missing mechanisms

release-please has run in shadow since v2.31.0: it proposes a release, the proposal is compared against the manual cut, and it is never merged. Three defects blocked the cutover and all three now have mechanisms.

The Release PR branch never ran the generators, so its own diff always failed validation on stale files. A new workflow regenerates every derived surface on that branch and commits the mirrors, push-triggered so both the bot's force-push and a maintainer's enrichment push re-run it.

The marketplace release pin could not be written at all by the automation's jsonpath updater, which also reformatted the JSON as a side effect. The pin is now generator-owned, with a targeted value swap that preserves formatting byte-for-byte.

And the GitHub About string is now generator-derived, so the manual runbook step and any future automated step use the identical string.

This release is the first time all of that ran together, and the shadow Release PR came out fully green with zero hand-fixes. The cutover itself was still deliberately deferred: ratifying an automation and exercising it for the first time in the same release would leave no way to tell which one was at fault if something went wrong.

### A tracked spec for the AI-product family

The scope for a future AI-product skill family existed only as five names in a maintainer-local file no external reader could see. It is now a tracked spec: four proposed skills with their phases, four increments to skills that already exist, seven exclusions with reasons, and the constraints any build inherits.

It also adds a build gate this project did not have. A proposed skill must beat a no-skill control arm before it is built, not after. The method comes from an experiment that killed a different proposed skill outright: a treatment arm with the framework against an equally capable control arm with none, the same scenarios, then independent judges each instructed to default to "the framework added nothing." Zero of three found a difference. One afternoon of work avoided a large build. **Nothing in this family is built by this release.**

## Two defects worth naming

An adversarial review before the tag found two claims that were verified against the thing that produced them rather than the thing a user meets.

The published project-memory config example did not work. It carries inline YAML comments, the frontmatter reader did not strip them, and the reader fails open by design, so a user copying the documented example got no declared phase and no warning. Fixed in the reader rather than the documentation, because a comment is valid YAML and people write them. The regression test now parses the example out of the real documentation file.

And the completeness claim above was not actually asserted. The test checked a hardcoded count of 53 with the accounting written in a comment; the exclusion list was never compared against the catalog. It is now exact set equality in both directions, verified by injecting a phantom skill and confirming the suite fails.

Both are fixed in this release. They are called out here because the failure mode generalizes: a test written by the same hand that wrote the thing it tests can pass while the claim it certifies is false.

## What this means for you

- **If you use the skills:** nothing changes unless you opt in. Create the memory file if you want the eight skills to read it; skip it and everything behaves as before.
- **If you watch the repo's automation:** the shadow Release PR now regenerates its own derived surfaces. It is still observed, not authoritative.
- **If you contribute:** a new skill joins the trigger-eval roster in the same merge that adds it, or is recorded as excluded with a rationale. There is no third state, and CI now enforces that rather than describing it.

## Upgrade

```
# Update path
/plugin marketplace update
/plugin install pm-skills@product-on-purpose

# Or re-download the release ZIP if you installed that way.
```

No action required beyond updating. The catalog remains 68 skills and 6 sub-agents.

## What does NOT change in v2.32.0

- Skill catalog (68), slash commands (11), and workflows (12) are unchanged.
- With no memory file present, every skill and both hooks behave exactly as in v2.31.1.
- The manual 6-gate runbook cut this release, as it has cut every release before it. release-please remains observed, not authoritative.

## Affected areas

| Area | Change |
|---|---|
| `skills/` | Eight skills gain a Project Memory Contract and a MINOR bump; ten gain trigger fixtures; three gain reciprocal boundary pointers. Catalog unchanged at 68 |
| `hooks/` | The phase router reads a declared phase; the frontmatter reader strips trailing YAML comments |
| `scripts/` | `check-memory-contracts.mjs` added; `gen-derived-surfaces.mjs` gains `--about` and the marketplace release pin; `trigger-eval-roster.yaml` gains `excluded:` with an `EXCLUDED` export |
| `.github/workflows/` | `release-please-regen.yml` added; `release-please.yml` updated |
| Docs | Project-memory schema and `artifacts[]` shape published; evals and runtime-components pages corrected; CONTRIBUTING documents the roster rule and the memory contract |
