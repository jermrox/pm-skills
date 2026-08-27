# utility-figjam-board - Version History

| Version | Date | Release | Effort | Type | Summary |
|---------|------|---------|--------|------|---------|
| 1.0.0 | 2026-08-26 | unreleased | - | added | First release. Establishes the board grammar (section, prompt text, working area, connector, legend) and the three source layouts, plus the scripts/figjam-board.mjs generator. |

## 1.0.0 (2026-08-26)

First release, shipped alongside `utility-figjam-workshop` and `utility-figjam-harvest` as the create step of the FigJam loop.

### Contract established
- Board grammar: five elements, legend mandatory
- Prompts and headers are TEXT nodes; stickies are reserved for participants
- Sections are participatory zones, sized to expected activity rather than hugged to placed content
- Generator: `scripts/figjam-board.mjs`, emitting a plan or executable Plugin API code
- Three source layouts: from a skill, from a workflow, from an artifact
- Prerequisites gate: MCP reachable, FigJam authoring skill loaded, source file actually read
- Refusal: never seed a section with invented examples; leave it empty and say so
