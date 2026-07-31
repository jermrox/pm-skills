---
slug: releases/Release_v2.31.1
title: Release v2.31.1
description: A maintenance patch that fixes a required-check misconfiguration which had silently blocked all site-only PRs, drains the dependency security queue from ten open alerts to zero, and repairs two latent site-build defects the updates surfaced.
draft: true
---

**Released 2026-07-31.** PATCH. No skill behavior change; catalog stays 68 skills / 6 sub-agents.

## The short version

A CI misconfiguration had been silently deadlocking the merge pipeline for three weeks: `validate-plugin` is a required status check, but its workflow only triggered on plugin-related paths. Any PR touching only the docs site or a lockfile never triggered it, the required check never reported, and GitHub blocked the merge forever, with every visible check green and nothing to click on. Nine pull requests piled up against that wall, eight of them dependency updates carrying open security alerts (four high severity).

This patch ships the unblock, the fully drained queue (ten open Dependabot alerts to zero), the two latent site-build defects the updates exposed, and one nondeterministic validator fix.

## What changed

**The required check always reports.** The `paths:` filter is removed from `validate-plugin`'s pull-request trigger, so the check runs (about 20 seconds) and reports on every PR. A comment in the workflow documents why the filter must not return without first removing the check from the branch ruleset.

**Security queue drained.** astro 7.0.2 to 7.1.6, @astrojs/starlight 0.41.0 to 0.41.5, sharp, svgo, dompurify, postcss, astro-mermaid, js-yaml (root), a transitive js-yaml in the issue-creation scripts (lockfile-only; no Dependabot PR existed for it), and CI actions checkout v7, setup-node v7, release-please-action v5. Zero open alerts after the drain, including a nested vulnerable sharp copy that only the astro upgrade removes.

**Site build survives astro 7.1.** Astro 7 stopped bundling `@astrojs/markdown-remark`; the site's remark-based link resolver depended on it transitively, which broke the moment the 7.1 dependency tree dropped it. It is now a declared direct dependency with a call-site comment explaining why it must not be pruned as unused.

**Site build survives Starlight 0.41.5.** The content schema re-declared Starlight's built-in `draft` field inside its `extend` object. Starlight 0.41.4 fixed extend merging, so the re-declaration started shadowing the built-in default, which emptied the entire production route collection and failed the build with a misleading missing-slug error. The redundant line is removed and a comment marks the rule: extend is for new fields only.

**A validator race fixed.** The bash AGENTS.md sync validator combined `set -o pipefail` with `printf | grep -q`, which nondeterministically reports present entries as missing when grep closes the pipe early. It survived fourteen consecutive green runs before firing on main. Replaced with a pure-bash membership loop and verified in both directions: it passes on the real tree and still fails when an entry is genuinely missing.

**Release automation observation.** This release is the first S1 exit-gate observation for the zero-drift program: the manual cut is diffed against release-please's shadow Release PR, and the findings (a marketplace version/ref desync the automation cannot yet write, JSON reformatting corruption, and CHANGELOG placement divergence) are recorded on the shadow PR for the eventual S2 cutover decision.

## Upgrade

No action required. CI, dependency, and documentation-site changes only; skills, commands, and their behavior are unchanged.
