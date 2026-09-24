---
name: utility-figjam-harvest
description: Reads a worked FigJam board and converts its stickies, clusters, votes, and decisions into a structured written artifact with every claim traced to a specific sticky. Use after a workshop when board content must become a durable document, or when handing board output to a downstream pm-skill. Refuses to invent content for illegible or empty regions. For building or running the board, use utility-figjam-board or utility-figjam-workshop.
license: Apache-2.0
metadata:
  classification: utility
  version: "1.0.0"
  updated: 2026-08-26
  category: research
  frameworks:
    - figjam
  author: product-on-purpose
---

<!-- PM-Skills | https://github.com/product-on-purpose/pm-skills | Apache 2.0 -->

# FigJam Harvest

Boards decay. People clear vote dots, drag stickies, and archive files, and six weeks later nobody can reconstruct what the room decided. This skill converts a worked board into a written artifact while the evidence is still on it.

## When to Use

- A workshop has ended and the board content needs to become a durable document
- Board output must feed a downstream pm-skill that expects written input
- Someone needs to know what a board says without opening it
- A decision made on a board needs an auditable record with the alternatives preserved

## When NOT to Use

- The board does not exist or has not been worked yet. Use `utility-figjam-board` to build it and `utility-figjam-workshop` to run it.
- You have interview transcripts rather than a board. Use `discover-interview-synthesis`.
- You want the attendee-facing meeting summary rather than a board-to-artifact conversion. Use `foundation-meeting-recap`.
- The board is one person's scratch thinking. Harvesting it lends solo notes the authority of group output.
- You are not sure which step of the loop you are at, or you want the router rather than a named step -> use `utility-pm-figjam-facilitator`, which picks build, run, or harvest from where the board already is.

## The Evidence Rule

Every line in the harvested artifact traces to something actually on the board. This is the whole point of the skill, and it is the rule most easily lost under pressure to produce a tidy document.

- **Quote stickies verbatim** when the wording carries meaning. Paraphrase only to merge near-duplicates, and say when you did.
- **Attribute where the board attributes.** If stickies carry authors, keep them. If they do not, say the board was anonymous rather than guessing.
- **Report votes as counts**, never as "the team agreed". Seven of twelve is not agreement, and the difference matters to whoever reads this later.
- **Name what you could not read.** Illegible handwriting, cut-off text, an image with no caption, a cluster with no label. A gap that is named is a gap someone can fix; a gap that is smoothed over becomes a false claim.
- **Never fill an empty section.** An empty section is a finding: that part of the board did not get worked. Record it as such.

If following this rule produces a thinner artifact than the user hoped for, produce the thin artifact and say why. A confident document built on invented board content is worse than an honest sparse one.

## Reading a Board

1. `get_figjam` for structure and text content: sections, stickies, connectors, labels.
2. `get_screenshot` for spatial relationships `get_figjam` does not convey: what sits near what, which cluster is visually dominant, where the vote dots actually landed.

Use both. Structure without layout loses the clustering, which is often where the meaning is. Layout without structure loses the text.

## Cluster Discipline

Boards carry two kinds of grouping and they mean different things.

| Grouping | What it means | How to harvest |
|----------|---------------|----------------|
| **Labeled cluster** | The room named this theme during the session | Use the room's label, quote its stickies under it |
| **Spatial proximity** | Stickies near each other, unlabeled | Report as "appears grouped", never as a named theme |

Do not promote spatial proximity into a named theme. That is your interpretation entering the record as the room's conclusion.

## Instructions

1. Read the board with both `get_figjam` and `get_screenshot`.
2. Inventory every section, including the empty ones.
3. For each section, transcribe stickies, preserving labeled clusters and vote counts.
4. Mark anything illegible, ambiguous, or empty as you go. Do not save this for the end.
5. Build the artifact in board order unless the user names a target format.
6. Write the evidence map: every artifact claim to its source sticky or cluster.
7. If a downstream pm-skill was named, format the output as that skill's input and say which skill it is aimed at.

## Output Contract

- **Harvest summary.** Board link, date read, section count, sticky count.
- **Section-by-section content.** Stickies transcribed under their clusters, with vote counts where present.
- **Decisions.** What was decided, by whom, with the alternatives that lost, when the board records them.
- **Gaps.** Empty sections, illegible stickies, unlabeled clusters, missing attribution. Each named specifically.
- **Evidence map.** Each claim in the artifact mapped to the sticky or cluster it came from.
- **Downstream handoff.** Which pm-skill this output is shaped for, if any.

## Quality Checklist

- [ ] Both `get_figjam` and `get_screenshot` were used
- [ ] Every section is accounted for, including empty ones
- [ ] Sticky text is quoted verbatim where wording matters
- [ ] Merged near-duplicates are flagged as merged
- [ ] Votes are reported as counts, never as consensus
- [ ] Labeled clusters keep the room's label; spatial groupings are not promoted to themes
- [ ] Illegible and ambiguous content is named, not smoothed over
- [ ] No empty section was filled with invented content
- [ ] The evidence map covers every claim

## Common Pitfalls

- **Tidying the room's language.** Rewriting stickies into house style erases the vocabulary the team actually used, which is often the most useful thing on the board.
- **Consensus inflation.** "The team agreed" from a 7-to-5 vote. Report the split.
- **Silent gap-filling.** An empty section quietly omitted reads as though it never existed. Name it.
- **Promoting your own clustering.** You grouped the stickies while reading; the room did not. Say which is which.
- **Harvesting mid-session.** A board still being worked produces a snapshot presented as a conclusion. Wait for the close, or label it a snapshot.

## Cross-Skill Usage

- `utility-figjam-board` builds the canvas; `utility-figjam-workshop` runs the session
- `discover-interview-synthesis` handles transcripts rather than boards
- `define-problem-statement`, `define-prioritization-framework`, and `foundation-persona` are common downstream targets for harvested board content
- `foundation-meeting-recap` produces the attendee-facing summary; this skill produces the board-to-artifact conversion
