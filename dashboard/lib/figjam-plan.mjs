// Board planning: turn a repo source (workflow or skill) into a structured board
// plan. Pure parsing and layout, no Figma calls, so it is testable offline and the
// same plan feeds both the generated Plugin API script and the human-readable plan.

import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './catalog.mjs';
import { parseFrontmatter } from './frontmatter.mjs';

// FigJam section tints, hex/255 notation required for exact palette matching.
// Varied across sections so adjacent sections read as distinct.
export const SECTION_TINTS = [
  { name: 'light blue', hex: [0xf5, 0xfb, 0xff] },
  { name: 'light green', hex: [0xeb, 0xff, 0xee] },
  { name: 'light violet', hex: [0xf8, 0xf5, 0xff] },
  { name: 'light yellow', hex: [0xff, 0xfb, 0xf0] },
  { name: 'light teal', hex: [0xf1, 0xfe, 0xfd] },
  { name: 'light pink', hex: [0xff, 0xf0, 0xfa] },
  { name: 'light orange', hex: [0xff, 0xf7, 0xf0] },
];

export const LAYOUT = {
  sectionWidth: 720,
  sectionHeight: 640,
  gapX: 160,
  padding: 32,
  headerSize: 40, // FigJam "Large" preset
  bodySize: 16,   // FigJam "Small" preset
  blockGap: 24,
};

const clean = (s) =>
  String(s || '')
    .replace(/\[`?([^\]`]+)`?\]\([^)]*\)/g, '$1') // markdown links to their text
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Board plan from a `_workflows/<slug>.md` playbook: one section per step, in
 *  sequence, each labeled with the pm-skill that runs there. */
export function planFromWorkflow(slug) {
  const file = path.join(REPO_ROOT, '_workflows', `${slug}.md`);
  if (!fs.existsSync(file)) throw new Error(`No such workflow: ${slug}`);
  const raw = fs.readFileSync(file, 'utf8');
  const { data, body } = parseFrontmatter(raw);

  const row = (label) => {
    const m = new RegExp(`\\|\\s*\\*\\*${label}\\*\\*\\s*\\|([^|]*)\\|`).exec(body);
    return m ? clean(m[1]) : '';
  };

  const steps = [];
  // Two heading shapes in the catalog: "### Step 1: Title" and the sprint
  // workflows' "### Step 1 (Monday, 90 min): Title". Workflows organised some
  // other way (lean-startup, triple-diamond) have no step headings at all and
  // are refused below rather than guessed at.
  const stepRe = /^### Step (\d+)(?:\s*\(([^)]*)\))?:\s*(.+)$/gm;
  const marks = [...body.matchAll(stepRe)];
  for (let i = 0; i < marks.length; i++) {
    const start = marks[i].index;
    const end = i + 1 < marks.length ? marks[i + 1].index : body.length;
    const chunk = body.slice(start, end);
    const skill = /\*\*Skill:\*\*\s*(.+)/.exec(chunk);
    const output = /\*\*Output:\*\*\s*([\s\S]*?)(?:\n\n|\n\*\*)/.exec(chunk);
    const handoff = /\*\*Handoff to next step:\*\*\s*([\s\S]*?)(?:\n\n|\n---|$)/.exec(chunk);
    steps.push({
      n: marks[i][1],
      note: clean(marks[i][2] || ''),
      title: clean(marks[i][3]),
      skill: skill ? clean(skill[1]) : '',
      output: output ? clean(output[1]) : '',
      handoff: handoff ? clean(handoff[1]) : '',
    });
  }
  if (!steps.length) {
    throw new Error(
      `${slug}.md has no "### Step N:" headings, so it declares no step sequence to lay out. ` +
      'Build a board from one of its member skills instead, with --skill.');
  }

  const sections = [];
  const inputs = row('Prerequisite Inputs');
  sections.push({
    key: 'inputs',
    name: 'Inputs',
    header: 'Inputs',
    // Guidance text, not participant content, so these become TEXT nodes.
    body: inputs
      ? [`What this workflow needs before Step 1: ${inputs}`, 'Add what you already have below.']
      : ['This workflow declares no prerequisite inputs. Add what you are starting from below.'],
    sourced: Boolean(inputs),
    from: 'Workflow metadata, Prerequisite Inputs',
  });
  for (const s of steps) {
    sections.push({
      key: `step-${s.n}`,
      name: `Step ${s.n}`,
      header: `Step ${s.n}: ${s.title}`,
      body: [
        s.note ? `When: ${s.note}` : null,
        s.skill ? `Skill: ${s.skill}` : 'Skill: (not named in the source)',
        s.output ? `Produces: ${s.output}` : 'Produces: (not named in the source)',
        'Work below. Add the artifact link when the step is done.',
      ].filter(Boolean),
      sourced: Boolean(s.skill || s.output),
      from: `Workflow Step ${s.n}`,
    });
  }
  sections.push({
    key: 'open-questions',
    name: 'Open questions',
    header: 'Open questions',
    body: ['Anything unresolved. Carried to the next session rather than quietly dropped.'],
    sourced: false,
    from: 'Appended by utility-figjam-board',
  });

  const connectors = [];
  for (let i = 0; i < steps.length; i++) {
    const from = i === 0 ? 'inputs' : `step-${steps[i - 1].n}`;
    connectors.push({
      from,
      to: `step-${steps[i].n}`,
      label: i === 0 ? 'start' : truncate(steps[i - 1].handoff || 'next', 60),
    });
  }
  connectors.push({
    from: `step-${steps[steps.length - 1].n}`,
    to: 'open-questions',
    label: 'unresolved',
  });

  return {
    title: `${data.title || slug}: workflow board`,
    sourceType: 'workflow',
    sourceFile: path.join('_workflows', `${slug}.md`),
    finalOutput: row('Final Output'),
    sections: withLayout(sections),
    connectors,
  };
}

/** Board plan from a `skills/<name>/SKILL.md`: one section per element of the
 *  skill's own output contract, in the contract's order. */
export function planFromSkill(name) {
  const file = path.join(REPO_ROOT, 'skills', name, 'SKILL.md');
  if (!fs.existsSync(file)) throw new Error(`No such skill: ${name}`);
  const { body } = parseFrontmatter(fs.readFileSync(file, 'utf8'));

  // Split on h2 boundaries rather than a lookahead: an `$` end-anchor under the
  // /m/ flag matches end-of-LINE, which truncated the capture to nothing.
  const section = (heading) => {
    const parts = body.split(/^## /m);
    for (const part of parts) {
      const nl = part.indexOf('\n');
      if (nl === -1) continue;
      const title = part.slice(0, nl).trim();
      if (title === heading || title.startsWith(`${heading} `) || title.startsWith(`${heading} (`)) {
        return part.slice(nl + 1);
      }
    }
    return '';
  };
  const bullets = (text) =>
    text.split(/\r?\n/)
      .filter((l) => /^\s*[-*]\s+/.test(l))
      .map((l) => clean(l.replace(/^\s*[-*]\s+/, '')))
      .filter(Boolean);

  const contract = section('Output Contract') || section('Output Structure') || section('Output Format');
  const outputs = bullets(contract);
  const whenTo = bullets(section('When to Use')).slice(0, 3);

  const sections = [{
    key: 'inputs',
    name: 'Inputs',
    header: 'Context and inputs',
    body: whenTo.length
      ? ['What this skill needs to run:', ...whenTo]
      : ['Add the context this skill needs.'],
    sourced: whenTo.length > 0,
    from: 'SKILL.md, When to Use',
  }];

  if (outputs.length) {
    outputs.forEach((o, i) => {
      const label = o.split(/[.:]/)[0].slice(0, 60);
      sections.push({
        key: `out-${i}`,
        name: label,
        header: label,
        body: [o, 'Work below.'],
        sourced: true,
        from: `SKILL.md, Output Contract item ${i + 1}`,
      });
    });
  } else {
    // Honest empty rather than an invented structure.
    sections.push({
      key: 'out-none',
      name: 'Output',
      header: 'Output',
      body: [`${name} declares no parsable output contract in SKILL.md. Section left unstructured on purpose.`],
      sourced: false,
      from: 'none: no Output Contract heading found',
    });
  }

  sections.push({
    key: 'open-questions',
    name: 'Open questions',
    header: 'Open questions',
    body: ['Anything unresolved.'],
    sourced: false,
    from: 'Appended by utility-figjam-board',
  });

  const connectors = [];
  for (let i = 0; i < sections.length - 1; i++) {
    connectors.push({ from: sections[i].key, to: sections[i + 1].key, label: '' });
  }

  return {
    title: `${name}: working session`,
    sourceType: 'skill',
    sourceFile: path.join('skills', name, 'SKILL.md'),
    finalOutput: '',
    sections: withLayout(sections),
    connectors,
  };
}

function truncate(s, n) {
  const t = clean(s);
  return t.length <= n ? t : t.slice(0, n - 1).replace(/\s+\S*$/, '') + '…';
}

/** Assign left-to-right positions and rotating tints. Sections keep uniform
 *  dimensions: they are participatory zones sized to expected activity, so they
 *  are never hugged to their seeded content. */
function withLayout(sections) {
  return sections.map((s, i) => ({
    ...s,
    index: i,
    x: i * (LAYOUT.sectionWidth + LAYOUT.gapX),
    y: 0,
    width: LAYOUT.sectionWidth,
    height: LAYOUT.sectionHeight,
    tint: SECTION_TINTS[i % SECTION_TINTS.length],
  }));
}

/** The human-readable plan, matching the skill's Output Contract. */
export function renderPlanReport(plan) {
  const lines = [];
  lines.push(`# ${plan.title}`, '');
  lines.push(`Source: ${plan.sourceFile} (${plan.sourceType})`, '');
  lines.push('## Section inventory', '');
  lines.push('| # | Section | Maps to | Seeded from source |');
  lines.push('|---|---------|---------|--------------------|');
  plan.sections.forEach((s, i) => {
    lines.push(`| ${i + 1} | ${s.header} | ${s.from} | ${s.sourced ? 'yes' : 'no, left as a prompt only'} |`);
  });
  lines.push('', '## Connectors', '');
  lines.push('| From | To | Label |');
  lines.push('|------|----|-------|');
  for (const c of plan.connectors) {
    const f = plan.sections.find((s) => s.key === c.from);
    const t = plan.sections.find((s) => s.key === c.to);
    lines.push(`| ${f ? f.header : c.from} | ${t ? t.header : c.to} | ${c.label || '(unlabeled)'} |`);
  }
  const unsourced = plan.sections.filter((s) => !s.sourced);
  lines.push('', '## Not seeded', '');
  if (unsourced.length) {
    for (const s of unsourced) lines.push(`- ${s.header}: ${s.from}`);
  } else {
    lines.push('- Every section carries content drawn from the source.');
  }
  return lines.join('\n');
}
