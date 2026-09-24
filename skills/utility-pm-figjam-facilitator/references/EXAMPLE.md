<!-- PM-Skills | https://github.com/product-on-purpose/pm-skills | Apache 2.0 -->
# FigJam Dispatch Record: "Get us a board for the discovery workflow before Thursday"

## Routing

| Field | Value |
|-------|-------|
| Request | "Get us a board for the discovery workflow before Thursday" |
| Client | Codex CLI |
| Dispatch path | inline execution of agents/pm-figjam-facilitator.md |
| Board state | does not exist |
| Routed to | utility-figjam-board |
| Why this step | "Get us a board" plus no board URL supplied, so nothing exists to run or harvest |

## Pre-flight

| Check | Result |
|-------|--------|
| Figma MCP server reachable | no |
| Seat can edit | not determined, blocked at the previous check |
| Board link supplied | none |

The Figma MCP server was not connected on this client, so no board was created.
The board plan below is complete and can be applied once the server is available;
`scripts/figjam-board.mjs --workflow customer-discovery --script` emits the
Plugin API code that builds it.

## Routed Output

Board plan for `_workflows/customer-discovery.md`, six sections:

| # | Section | Maps to | Prompted from source |
|---|---------|---------|----------------------|
| 1 | Inputs | Workflow metadata, Prerequisite Inputs | yes |
| 2 | Step 1: Interview Synthesis | Workflow Step 1 | yes |
| 3 | Step 2: Jobs to Be Done Canvas | Workflow Step 2 | yes |
| 4 | Step 3: Opportunity Tree | Workflow Step 3 | yes |
| 5 | Step 4: Problem Statement | Workflow Step 4 | yes |
| 6 | Open questions | Appended by utility-figjam-board | no, left as a prompt only |

Connectors run in step order, each labelled with the workflow's own handoff
wording. No gates: `customer-discovery` is step-shaped and declares no
transition criteria, so none were invented.

Not created: no board exists yet, for the reason recorded in Pre-flight.

## Next Step in the Loop

| From | Natural next step | Skill |
|------|-------------------|-------|
| Build | Run the Thursday session on the board once it exists | `utility-figjam-workshop` |
