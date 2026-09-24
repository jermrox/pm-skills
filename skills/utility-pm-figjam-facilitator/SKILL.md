---
name: utility-pm-figjam-facilitator
description: Runs the FigJam board loop through the pm-figjam-facilitator sub-agent, routing to build, run, or harvest depending on where the board already is. Use on any AI client to work a board without depending on native plugin sub-agent support. Dispatches natively on Claude Code and executes the agent definition inline elsewhere. Requires a connected Figma MCP server for board authoring and says so plainly when one is unreachable.
license: Apache-2.0
metadata:
  classification: utility
  version: "1.0.0"
  updated: 2026-09-04
  category: coordination
  frameworks: [figjam]
  author: product-on-purpose
---
<!-- PM-Skills | https://github.com/product-on-purpose/pm-skills | Apache 2.0 -->
# PM FigJam Facilitator (Dispatch Skill)

This skill is a cross-client dispatch wrapper for the `pm-figjam-facilitator` sub-agent. It exists so users on non-Claude clients can work a FigJam board with the same intent as Claude Code users, without depending on native plugin sub-agent infrastructure.

Sub-agents are a Claude Code plugin feature. Non-Claude clients (Codex CLI, Cursor, Windsurf, Copilot, Gemini CLI) cannot natively load `agents/pm-figjam-facilitator.md`. This skill bridges the gap.

## When to Use

- You want board work done and are not sure which step of the loop you are at
- You are running on a non-Claude AI client and the `pm-figjam-facilitator` sub-agent is not natively available
- You are running on Claude Code and prefer skill-invocation semantics, for consistency inside a workflow that mixes skills and sub-agent intents

## When NOT to Use

- You already know the step. Invoke the skill directly: `utility-figjam-board` to build, `utility-figjam-workshop` to run a session, `utility-figjam-harvest` to convert a worked board back into a document. This wrapper only routes.
- You want a diagram inside a document rather than a collaborative canvas -> use `utility-mermaid-diagrams`
- You want adversarial review of a produced artifact -> use `utility-pm-critic`
- You want polished UI work in Figma Design rather than a FigJam whiteboard. That is outside every skill in this family.

## Instructions

**Runtime detection step.** Determine which AI client is invoking this skill.

### If you are running in Claude Code with the pm-skills plugin installed

Invoke `@agent-pm-skills:pm-figjam-facilitator` with the user's request and any board URL from `$ARGUMENTS`. Return the sub-agent's output to the user. No further action needed from this skill; the sub-agent routes and executes natively in its own context window.

### If you are running in any other AI client

Codex CLI, Cursor, Windsurf, Copilot, Gemini CLI, ChatGPT, or any other client without native pm-skills plugin sub-agent support:

1. **Pre-flight the Figma MCP server.** Board authoring and board reading both require it. If it is unreachable, continue: produce the plan or run sheet, and state plainly that no board was created or read. Never report a board link you did not receive.
2. Read the canonical sub-agent definition at `agents/pm-figjam-facilitator.md`
3. Execute the system prompt body in that file as your operating instructions for this turn
4. Route to the step the request is actually at, using the table below
5. Read that skill's `SKILL.md` and follow its output contract in full, including its gaps and not-created sections

| Where the board is | Step | Skill to execute |
|---|---|---|
| Does not exist yet | Build | `skills/utility-figjam-board/SKILL.md` |
| Exists, session upcoming or live | Run | `skills/utility-figjam-workshop/SKILL.md` |
| Worked, session over | Harvest | `skills/utility-figjam-harvest/SKILL.md` |

Ask which step only when the request is genuinely ambiguous. "Set up a board for Thursday" is build. "What did we decide?" is harvest.

## Output Format

The output contract belongs to whichever skill the request routes to; this wrapper adds no envelope of its own. See `references/TEMPLATE.md` for the routing record to return alongside it, and `references/EXAMPLE.md` for a worked cross-client dispatch run.

## Composition

- **Skills:** routes to `utility-figjam-board`, `utility-figjam-workshop`, and `utility-figjam-harvest`. Harvested board content commonly feeds `define-problem-statement`, `define-prioritization-framework`, or `foundation-persona`.
- **Sub-agents:** on Claude Code this skill dispatches to the `pm-figjam-facilitator` sub-agent. On non-Claude clients this skill IS the inline execution; no further dispatch.
- **Generator:** `scripts/figjam-board.mjs` turns a workflow or skill into a board plan, or with `--script` into executable Figma Plugin API code. Prefer it over hand-assembling a board.

## Cross-Client Notes

Board authoring additionally requires a Figma seat that can edit. A View seat can read boards but cannot create or modify one, and `create_new_file` is rejected outright. Report that as a seat limitation rather than a failure of this skill.

The "read and execute inline" pattern depends on the AI being able to:

1. Read a file path provided as a reference
2. Treat that file's content as operating instructions for the current turn
3. Read additional referenced skill contracts at invocation time

If any of these are unreliable on a given client, that client cannot use this dispatch skill effectively.

## Reference Files

- Canonical sub-agent definition: [`agents/pm-figjam-facilitator.md`](../../agents/pm-figjam-facilitator.md)
- The three skills it routes to: [`utility-figjam-board`](../utility-figjam-board/SKILL.md), [`utility-figjam-workshop`](../utility-figjam-workshop/SKILL.md), [`utility-figjam-harvest`](../utility-figjam-harvest/SKILL.md)
- Usage guide: [`dashboard/FIGJAM.md`](../../dashboard/FIGJAM.md)
