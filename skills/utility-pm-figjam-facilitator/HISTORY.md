# utility-pm-figjam-facilitator - Version History

| Version | Date | Release | Effort | Type | Summary |
|---------|------|---------|--------|------|---------|
| 1.0.0 | 2026-09-04 | unreleased | - | added | First release. Cross-client dispatch wrapper for the pm-figjam-facilitator sub-agent, closing the gap that left the agent reachable only on Claude Code. |

## 1.0.0 (2026-09-04)

First release. `pm-figjam-facilitator` shipped without a dispatch skill, so the
FigJam loop was reachable by name only on Claude Code. Every other user-facing
sub-agent carries one at `skills/utility-pm-{role}/`, and no validator enforces
the pairing, so the gap passed CI silently.

### Contract established
- Runtime detection with two branches, matching the other dispatch skills
- A FigJam-specific pre-flight the sibling dispatch skills do not need: confirm the Figma MCP server is reachable, and continue with the plan rather than claiming a board when it is not
- Routing table from board state to the three FigJam skills
- Refusal: never report a board link the tool did not return
- Seat limitation recorded as a seat limitation, not as a skill failure
