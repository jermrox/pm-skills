#!/usr/bin/env node
// figjam-board.mjs - build a FigJam board plan and its executable Plugin API
// script from a repo source, without needing the dashboard.
//
//   node scripts/figjam-board.mjs --workflow customer-discovery
//   node scripts/figjam-board.mjs --skill foundation-lean-canvas --script
//   node scripts/figjam-board.mjs --workflow design-sprint --out board.js
//
// Prints the board plan by default. With --script it prints the JavaScript to
// hand to the Figma MCP `use_figma` tool. The script is generated offline and
// is verified by dashboard/figjam.test.mjs against a mock Plugin API; running
// it against a real file needs a connected Figma MCP server and an edit seat.

import fs from 'node:fs';
import { planFromWorkflow, planFromSkill, renderPlanReport } from '../dashboard/lib/figjam-plan.mjs';
import { renderPluginScript } from '../dashboard/lib/figjam-script.mjs';

const USAGE = `Usage:
  node scripts/figjam-board.mjs --workflow <slug> [--script] [--out <file>]
  node scripts/figjam-board.mjs --skill <name> [--script] [--out <file>]

Options:
  --workflow <slug>  Build from a _workflows/<slug>.md playbook
  --skill <name>     Build from a skills/<name>/SKILL.md output contract
  --script           Print the executable Plugin API script instead of the plan
  --out <file>       Write output to a file instead of stdout
  --help             Show this message`;

function parseArgs(argv) {
  const args = { script: false, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') args.help = true;
    else if (a === '--script') args.script = true;
    else if (a === '--workflow') args.workflow = argv[++i];
    else if (a === '--skill') args.skill = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else throw new Error(`unknown argument: ${a}`);
  }
  return args;
}

function main(argv) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (e) {
    console.error(e.message + '\n\n' + USAGE);
    process.exit(2);
  }
  if (args.help || (!args.workflow && !args.skill)) {
    console.log(USAGE);
    process.exit(args.help ? 0 : 2);
  }
  if (args.workflow && args.skill) {
    console.error('Pass --workflow or --skill, not both.\n\n' + USAGE);
    process.exit(2);
  }

  let plan;
  try {
    plan = args.workflow ? planFromWorkflow(args.workflow) : planFromSkill(args.skill);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  const output = args.script ? renderPluginScript(plan) : renderPlanReport(plan);
  if (args.out) {
    fs.writeFileSync(args.out, output, 'utf8');
    console.error(`wrote ${args.out} (${plan.sections.length} sections)`);
  } else {
    console.log(output);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main(process.argv.slice(2));
export { parseArgs, main };
