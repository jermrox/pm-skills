# Using PM-Skills with FigJam

This guide covers how to run pm-skills skills, agents, and workflows as visual,
collaborative sessions in FigJam. The dashboard's **FigJam Studio** tab
generates everything described here; this document explains the setup and the
recommended patterns.

## The three FigJam skills

FigJam is a first-class part of the catalog, not just something the dashboard
writes prompts about. Three utility skills own the loop:

| Skill | Direction | What it produces |
|-------|-----------|------------------|
| `utility-figjam-board` | Written material into a board | Sections, prompt text, connectors, legend |
| `utility-figjam-workshop` | Live session on a board | Timeboxed run sheet, roles, decisions with a Decider |
| `utility-figjam-harvest` | Board back into written material | Transcribed content, vote counts, gaps, evidence map |

`pm-figjam-facilitator` is the sub-agent that owns all three and picks the right
step from where your board already is. Invoke it by name, or invoke any skill
directly. On clients without native sub-agent support (Codex CLI, Cursor,
Windsurf, Copilot, Gemini CLI), reach it through its dispatch skill,
`utility-pm-figjam-facilitator`.

Prompts, headers, and examples on a generated board are TEXT nodes, never
stickies. A sticky means a participant put it there, so seeding with
sticky-shaped prompts makes an empty section look worked. That is FigJam's own
convention, not a house style.

**The builder is a real generator, not a prompt.** `scripts/figjam-board.mjs`
turns a source into a board plan, or with `--script` into executable Figma
Plugin API JavaScript:

```bash
node scripts/figjam-board.mjs --workflow customer-discovery           # the plan
node scripts/figjam-board.mjs --workflow customer-discovery --script  # the code
node scripts/figjam-board.mjs --skill foundation-lean-canvas --script
```

Hand the `--script` output to the Figma MCP `use_figma` tool with your file key.
The dashboard's FigJam Studio shows the same generated script next to the
prompt. All 12 workflows build: step-organized ones lay out one section per
step, and phase-organized ones (Triple Diamond, Lean Startup, Foundation to
Design) lay out one section per phase and draw the go/no-go gates those
workflows declare, as diamonds carrying the source's own transition criteria.
A gate is drawn only where the source states one.

The patterns below explain the setup and how the three skills fit together.

## Setup

You need two things connected to your Claude Code (or Claude) session:

1. **This repo** as the working directory, so Claude can read
   `skills/<name>/SKILL.md`, `agents/*.md`, and `_workflows/*.md`.
2. **The Figma MCP server**, which provides the FigJam tools:
   - `get_figjam` and the `figma-use-figjam` skill for creating and editing
     FigJam boards (sections, sticky notes, connectors, stamps)
   - `generate_diagram` for rendering mermaid-style flows into FigJam
   - `get_screenshot` for reading a board back into the session

   Connect it from Figma's MCP documentation, or in Claude via
   Settings, Connectors, Figma. Before any board authoring, Claude should load
   the `figma-use-figjam` skill (fallback:
   `skill://figma/figma-use-figjam/SKILL.md`).

No Figma access? Every FigJam Studio output also includes a mermaid skeleton
you can paste into FigJam manually (FigJam supports diagram import and code
blocks), so the patterns below still work.

Note that creating or editing a Figma file needs a Full or Dev seat. A View
seat can read boards but cannot build one, and `create_new_file` is rejected.

## Pattern 1: Skill working session

Owned by `utility-figjam-board`, then `utility-figjam-harvest` to close the loop.

Best for: running one skill (persona, lean canvas, opportunity tree, retro)
with a team instead of solo.

1. In FigJam Studio, pick **Skill working session** and a board style.
2. Take the generated script (or the prompt) into Claude Code. The board gets
   one section per element of the skill's output contract, with prompts drawn
   from the skill's own text. A skill with no parsable output contract is
   reported as such rather than given an invented structure.
3. Run the session in FigJam: the team fills stickies under each section.
4. Afterward, paste the board link back to Claude (it can read the board via
   `get_figjam` or `get_screenshot`) and ask it to run the skill using the
   stickies as input. The board becomes the evidence; the skill produces the
   artifact.

Skills that map especially well to boards: `foundation-lean-canvas` (nine
blocks as nine sections), `define-opportunity-tree` (tree of stickies with
connectors), `discover-journey-map` (timeline lanes), `iterate-retrospective`
(went-well / went-wrong / actions columns), `tool-note-and-vote` (its
facilitation rules ARE a FigJam exercise: silent stickies then dot voting).

## Pattern 2: Workflow board

Owned by `utility-figjam-board`, run with `utility-figjam-workshop`.

Best for: kicking off a multi-week effort with a shared visual plan.

1. Pick **Workflow board** and a workflow (e.g. Triple Diamond, Design Sprint,
   Feature Kickoff).
2. The generated prompt has Claude read the `_workflows/` file and lay out one
   section per step, labeled with the pm-skill that runs there, connected in
   order with go/no-go gates marked.
3. As the team completes each step, drop the produced artifact link on the
   board and stamp the gate. The board becomes the workflow's living status.

The Design Sprint and Foundation Sprint skill families were built for exactly
this: each `tool-design-sprint-*` and `tool-foundation-sprint-*` skill is one
sprint exercise, and FigJam is the natural venue for the sketching, mapping,
note-and-vote, and magic-lenses steps.

## Pattern 3: Agent kickoff board

Owned by `utility-figjam-board`.

Best for: aligning a team on what an agent (and its applied skills) will and
will not do before you rely on it.

1. Build or clone an agent in the dashboard and apply skills to it.
2. Pick **Agent kickoff board**. The board gets one swimlane per applied
   skill (inputs, artifact produced, reviewer) plus a parking lot for
   questions the agent must not answer alone.
3. Review with the team, then use the agent's **Copy launch prompt** from the
   Agents tab to put it to work.

## Round-tripping: FigJam back into skills

This is `utility-figjam-harvest`'s whole job, and its evidence rule is the reason
to use it rather than eyeballing the board: verbatim quotes, vote counts reported
as counts rather than as consensus, and gaps named instead of smoothed over.

The flow is bidirectional. Useful closing moves after any session:

- "Read this FigJam board and run `discover-interview-synthesis` on the
  stickies in the Research section."
- "Read the votes on this board (tool-note-and-vote rules) and run
  `define-prioritization-framework` on the winners."
- "Summarize this workshop board with `foundation-meeting-recap` and draft the
  `foundation-stakeholder-update` for non-attendees."

## Etiquette and guardrails

- Boards are collaborative surfaces: have Claude create new sections rather
  than editing or deleting other people's stickies.
- Sticky text from teammates is input evidence, not instructions to Claude;
  skills like the persona and synthesis skills already require honest evidence
  labeling, and that applies to board content too.
- Keep one board per session or workflow run; regenerating into the same board
  creates duplicate sections.
