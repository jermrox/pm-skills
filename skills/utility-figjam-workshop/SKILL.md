---
name: utility-figjam-workshop
description: Runs a facilitated working session on a FigJam board, producing a timeboxed run sheet with roles, a silent-first contribution sequence, voting mechanics, and a decision record. Use when a group needs to work a board together and you want the session to produce durable decisions rather than a wall of unsorted stickies. For building the board beforehand, use utility-figjam-board. For turning the finished board into an artifact, use utility-figjam-harvest.
license: Apache-2.0
metadata:
  classification: utility
  version: "1.0.0"
  updated: 2026-08-26
  category: coordination
  frameworks:
    - figjam
    - character-note-and-vote
  author: product-on-purpose
---

<!-- PM-Skills | https://github.com/product-on-purpose/pm-skills | Apache 2.0 -->

# FigJam Workshop Runner

Turn a prepared board into a session that ends with decisions. This skill produces the run sheet and drives the session; it does not build the canvas and does not write the follow-up artifact.

## When to Use

- A group needs to work a FigJam board together and you are facilitating
- A session keeps producing stickies but no decisions, and you need structure that closes
- Remote or hybrid participants need an explicit turn-taking protocol
- A decision needs an audit trail showing what was considered and why the chosen option won

## When NOT to Use

- The board does not exist yet. Use `utility-figjam-board` first; facilitating an empty canvas wastes the room.
- The session is over and you need the write-up. Use `utility-figjam-harvest`.
- You need the attendee-facing agenda document rather than a facilitator run sheet. Use `foundation-meeting-agenda`; that artifact is shared, this one is operational.
- You need the post-session summary for attendees. Use `foundation-meeting-recap`.
- The decision belongs to one person who simply needs to make it. A workshop adds ceremony without adding information.

## Roles

Name every role before the session starts. Unnamed roles default to whoever talks most.

| Role | Owns | Notes |
|------|------|-------|
| **Facilitator** | Time, sequence, protocol | Does not contribute content; the moment they start arguing the position, the protocol has no owner |
| **Decider** | The final call | Must be present or have delegated in writing before the session |
| **Scribe** | Decisions and actions as they happen | Captures on the board, not in a side document that nobody sees again |
| **Participants** | Content | Everyone else, including the PM |

One person can hold Facilitator and Scribe on a small board. Facilitator and Decider must be different people.

## The Silent-First Sequence

Every working block on the board runs the same five beats. The order matters: independent thinking is destroyed by hearing someone else's answer first, and it cannot be recovered later in the session.

```text
1. Frame        (1-2 min)  Facilitator states the question the section answers
2. Silent write (3-7 min)  Everyone adds stickies alone, no talking, no reading others
3. Cluster      (3-5 min)  Group similar stickies together, still mostly silent
4. Discuss      (5-10 min) Talk the clusters, not the individual stickies
5. Close        (2-5 min)  Vote, or Decider calls it, and the scribe records it
```

Skipping beat 2 is the most common failure and the most expensive. Skipping beat 5 is the second most common and produces the wall-of-stickies outcome this skill exists to prevent.

## Timeboxing

Build the run sheet backwards from the hard stop, not forwards from the start.

- Reserve the final 10 minutes for decisions and actions. Take it out of the budget first.
- Allot per section, not per hour. A section with no allotted time will not get worked.
- Cap any single section at 25 minutes. Longer means the section is really two sections.
- Announce each timebox before the beat starts and hold it. A timebox that slips once stops functioning for the rest of the session.
- Leave one 5-minute buffer per hour. It will be used.

## Voting

When a section closes with a vote rather than a straight Decider call, use the mechanic from `tool-note-and-vote`: silent multi-vote, then discussion of the distribution, then Decider supervote. Two rules specific to a board:

- Vote on clusters, not individual stickies, or the count measures who wrote most rather than what the group thinks.
- Record the counts on the board before moving on. Vote dots get moved, cleared, and re-cast; a written count is the only durable record.

## Instructions

1. Confirm the board exists and read it (`get_figjam`, or `get_screenshot` for layout). Do not run a session on a board you have not looked at.
2. Name the four roles. Refuse to proceed without a Decider identified.
3. Build the run sheet: sections in board order, each with a timebox and a close mechanic (vote or Decider call), reserving the last 10 minutes.
4. Run each section through the five beats, announcing each timebox.
5. Record every decision on the board as it happens, in a dedicated Decisions section, with the date and the Decider's name.
6. In the reserved final block, read the decisions back aloud and capture actions with owners and dates.
7. Hand off: point the user at `utility-figjam-harvest` for the write-up.

## Output Contract

Produce the run sheet before the session and the record after it.

**Run sheet (before):** every section with timebox, close mechanic, and the question it answers; the four roles filled in; the hard stop.

**Session record (after):** decisions with Decider and date; actions with owner and date; vote counts as counts; sections that did not get worked, named honestly rather than quietly dropped.

## Quality Checklist

- [ ] The board was read before the run sheet was written
- [ ] All four roles are named, and Facilitator and Decider are different people
- [ ] Every section has a timebox and a stated close mechanic
- [ ] The final 10 minutes are reserved for decisions and actions
- [ ] Silent write precedes every discussion beat
- [ ] Votes are cast on clusters and the counts are written down
- [ ] Every decision has a Decider and a date
- [ ] Every action has an owner and a date
- [ ] Unworked sections are named, not dropped

## Common Pitfalls

- **Discussion before silent write.** The first person to speak sets the frame and the rest of the room anchors to it. Unrecoverable within the session.
- **The facilitator with an opinion.** When the facilitator argues content, nobody owns the protocol and the timeboxes stop being enforced.
- **Voting on stickies.** Measures volume of writing, not weight of opinion. Cluster first.
- **No reserved close.** The session ends when time runs out rather than when decisions are made, and the board becomes someone's homework.
- **Silent absent participants.** A board makes non-participation invisible. Check the sticky distribution during beat 3, not after the session.

## Cross-Skill Usage

- `utility-figjam-board` builds the canvas this skill runs on
- `utility-figjam-harvest` converts the finished board into a written artifact
- `tool-note-and-vote` is the decision mechanic used at every close
- `foundation-meeting-agenda` produces the attendee-facing agenda; this skill produces the facilitator's run sheet
- `foundation-meeting-recap` writes the post-session summary for attendees
