# PM-Skills Dashboard

A local, zero-dependency dashboard for browsing the pm-skills catalog, composing
agents from skills, and generating FigJam boards from skills, agents, and
workflows.

## Run it

```bash
npm run dashboard
# or: node dashboard/server.mjs [port]
```

Then open http://127.0.0.1:4680. Requires Node 18+. No install step: the server
uses only the Node standard library and reads the repo directly from disk, so
the dashboard always reflects the current checkout.

The server binds to 127.0.0.1 only and never talks to the network.

## What it does

### Skills tab
Browse and filter all catalog skills (loaded live from `skill-manifest.json`)
by group (phase, foundation, utility, tool) and Triple Diamond phase, with full
text search.

- **Apply to agent**: click a skill, pick an agent, and the skill is written
  into that agent's managed Skill Access block.
- **Copy invoke prompt**: copies a ready-to-paste Claude Code prompt that runs
  the skill against your context.

### Agents tab
Shows both kinds of agents:

- **Repo agents** (`agents/*.md`): the curated sub-agents that ship with
  pm-skills. These are read-only in the dashboard; use **Clone to local** to
  get an editable copy.
- **Local agents** (`.claude/agents/*.md`): your own agents. This directory is
  gitignored and is auto-discovered by Claude Code, so an agent created here is
  immediately usable in your Claude Code sessions.

Applied skills show as removable chips on local agents. **Copy launch prompt**
gives you a paste-ready prompt that delegates a task to the agent with its
applied skills.

### Agent Builder tab
Create a new agent that follows the pm-skills sub-agent framework:

- Frontmatter contract: `name`, `description` (drives delegation), `tools`,
  `model`, `memory`
- Body sections: Identity, Focus, Skill Access, What You Do, What You Do NOT Do
- The `Agent` tool is never granted (chain depth rule D14; see
  `agents/_chain-permitted.yaml`)

Pick tools and click skills to apply them; the live preview shows the exact
markdown written to `.claude/agents/<name>.md`.

### Workflows tab
Lists the `_workflows/` playbooks with their summaries and skill coverage.
**Copy run prompt** produces a step-by-step, gated run prompt for Claude Code;
**Open in FigJam Studio** jumps straight to board generation for that workflow.

### FigJam Studio tab
Turns any skill, agent, or workflow into FigJam material, in two forms:

1. **Claude Code + Figma MCP prompt**: paste into a Claude Code session with
   the Figma MCP server connected. The prompt instructs Claude to read the
   source (SKILL.md, agent definition, or workflow file), load the FigJam
   authoring skill, and build the board (workshop stickies, flow diagram, or
   kanban columns) directly in FigJam.
2. **Mermaid board skeleton**: a diagram you can paste into FigJam yourself or
   feed to the Figma MCP `generate_diagram` tool.

See [FIGJAM.md](FIGJAM.md) for the full FigJam usage guide.

## How skill application works

Applied skills live inside the agent markdown in a managed block:

```markdown
<!-- pm-dashboard:skills:start -->
- foundation-persona
- deliver-prd
<!-- pm-dashboard:skills:end -->
```

The dashboard only ever rewrites the content between these markers, so the rest
of the agent file is yours to edit freely. Repo agents are never mutated:
applying a skill to one clones it to `.claude/agents/<name>-local.md` first.

## API

All endpoints are JSON over localhost:

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/data` | Full catalog: skills, agents, workflows, allowed tools/models |
| POST | `/api/agents` | Create a local agent from a builder payload |
| POST | `/api/agents/clone` | Clone a repo agent to `.claude/agents/` |
| POST | `/api/agents/skills` | Add or remove a skill on a local agent |
| DELETE | `/api/agents/:name` | Delete a local agent |
