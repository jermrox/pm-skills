<!-- PM-Skills | https://github.com/product-on-purpose/pm-skills | Apache 2.0 -->
# FigJam Board Plan: Checkout Abandonment Discovery

## Source

| Field | Value |
|-------|-------|
| Source type | workflow |
| Source file | `_workflows/customer-discovery.md` |
| Layout | one section per step, connected in sequence, gates marked |
| Audience | PM, two designers, one researcher, one engineer |
| Session date | first working session, then left open for async additions |

## Section Inventory

| # | Section title | Maps to | Seeded from | Working area |
|---|---------------|---------|-------------|--------------|
| 1 | Research questions | Step 1, interview planning | Workflow step text | yes |
| 2 | Participant criteria | Step 1, screening | Workflow step text | yes |
| 3 | Interview notes | Step 2, conduct interviews | empty, no source examples | yes |
| 4 | Observed patterns | Step 3, `discover-interview-synthesis` | Skill EXAMPLE.md, 3 seeds | yes |
| 5 | Personas | Step 4, `foundation-persona` | Skill EXAMPLE.md, 2 seeds | yes |
| 6 | Problem statement candidates | Step 5, `define-problem-statement` | Skill EXAMPLE.md, 2 seeds | yes |
| 7 | Open questions | appended by this skill | empty | yes |

## Connectors and Gates

| From | To | Label | Type |
|------|----|-------|------|
| Research questions | Participant criteria | who can answer these | flow |
| Interview notes | Observed patterns | synthesis pass | flow |
| Observed patterns | Personas | who these patterns belong to | flow |
| Personas | Problem statement candidates | Gate: do we have enough evidence to name the problem? | gate |
| Problem statement candidates | Open questions | anything unresolved | dependency |

## Legend

| Mark | Meaning |
|------|---------|
| Grey sticky | Seed placed by the builder |
| Yellow sticky | Participant contribution |
| Diamond | Go/no-go gate |
| Blue dot | Vote |

## Not Created

- The workflow's "Estimated Duration" and "Prerequisite Inputs" metadata rows. They describe the workflow, not work the team does on the board, so they went into the legend area as a single note rather than a section.
- Section 3 was left unseeded. The customer-discovery workflow has no example interview notes, and inventing plausible ones would have put fabricated research on a board people would later treat as real.

## Result

| Field | Value |
|-------|-------|
| Board link | https://figma.com/board/EXAMPLE-checkout-abandonment |
| Sections created | 7 |
| Sections left empty | Section 3 (Interview notes) and Section 7 (Open questions), both intentionally, awaiting the session |
