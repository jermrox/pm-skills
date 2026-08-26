import test from 'node:test';
import assert from 'node:assert/strict';
import { planFromWorkflow, planFromSkill, renderPlanReport, SECTION_TINTS } from './lib/figjam-plan.mjs';
import { renderPluginScript } from './lib/figjam-script.mjs';
import { createMockFigma, runPluginScript, assertExactPaletteChannels } from './lib/figjam-mock.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './lib/catalog.mjs';

test('planFromWorkflow reads real steps out of the playbook', () => {
  const p = planFromWorkflow('customer-discovery');
  const headers = p.sections.map((s) => s.header);
  assert.equal(headers[0], 'Inputs');
  assert.equal(headers[headers.length - 1], 'Open questions');
  assert.ok(headers.some((h) => h.startsWith('Step 1:')));
  assert.ok(headers.some((h) => h.startsWith('Step 4:')));
  // Every step section names the skill that runs there, taken from the source.
  const step1 = p.sections.find((s) => s.key === 'step-1');
  assert.ok(step1.body.some((b) => b.includes('interview-synthesis')), step1.body.join(' | '));
  // Connectors run in order and carry the source's own handoff text.
  assert.equal(p.connectors.length, p.sections.length - 1);
  assert.ok(p.connectors.some((c) => c.label && c.label !== 'start' && c.label !== 'unresolved'));
});

test('planFromWorkflow rejects an unknown workflow instead of inventing one', () => {
  assert.throws(() => planFromWorkflow('no-such-workflow'), /No such workflow/);
});

test('planFromSkill reports honestly when a skill has no parsable output contract', () => {
  // foundation-meeting-agenda declares no Output Contract / Structure / Format
  // heading, so the builder must say so rather than invent a structure.
  const p = planFromSkill('foundation-meeting-agenda');
  const empty = p.sections.find((s) => s.key === 'out-none');
  assert.ok(empty, 'expected the honest-empty section');
  assert.equal(empty.sourced, false);
  assert.match(empty.body[0], /no parsable output contract/);
});

test('planFromSkill builds one section per output-contract item when there is one', () => {
  const p = planFromSkill('utility-figjam-harvest');
  assert.ok(p.sections.every((s) => s.key !== 'out-none'), 'this skill does declare a contract');
  const outs = p.sections.filter((s) => s.key.startsWith('out-'));
  assert.ok(outs.length >= 4, `expected several contract sections, got ${outs.length}`);
  assert.ok(outs.every((s) => s.sourced));
});

test('sections are uniform participatory zones, laid out without overlap', () => {
  const p = planFromWorkflow('customer-discovery');
  const w = p.sections[0].width;
  assert.ok(p.sections.every((s) => s.width === w && s.height === p.sections[0].height),
    'grid sections must keep uniform dimensions');
  for (let i = 1; i < p.sections.length; i++) {
    assert.ok(p.sections[i].x >= p.sections[i - 1].x + p.sections[i - 1].width,
      `section ${i} overlaps its predecessor`);
  }
});

test('adjacent sections get different tints', () => {
  const p = planFromWorkflow('customer-discovery');
  for (let i = 1; i < Math.min(p.sections.length, SECTION_TINTS.length); i++) {
    assert.notEqual(p.sections[i].tint.name, p.sections[i - 1].tint.name);
  }
});

test('the generated script is syntactically valid JavaScript', () => {
  const script = renderPluginScript(planFromWorkflow('customer-discovery'));
  assert.doesNotThrow(() => new Function('figma', `return (${script.trim().replace(/;\s*$/, '')});`));
});

test('the generated script obeys the FigJam API rules', () => {
  const script = renderPluginScript(planFromWorkflow('customer-discovery'));
  assert.match(script, /^\(async \(\) => \{/, 'must be wrapped in an async IIFE');
  assert.match(script, /figma\.closePlugin\(\)/, 'must close the plugin');
  assert.ok(!/figma\.createPage/.test(script), 'createPage does not exist in FigJam');
  assert.ok(!/loadAllPagesAsync|setPluginData|createImageAsync/.test(script), 'unsupported APIs');
  assert.deepEqual(assertExactPaletteChannels(script), [], 'colors must use hex/255 notation');
  // Prompts are text nodes; stickies are reserved for participants.
  assert.ok(!/createSticky/.test(script), 'the builder must not place stickies as prompts');
});

test('the generated script runs against the enforcing mock and builds the board', async () => {
  const plan = planFromWorkflow('customer-discovery');
  const script = renderPluginScript(plan);
  const figma = createMockFigma();
  const { result } = await runPluginScript(script, figma);

  assert.equal(figma._closed, 1, 'closePlugin called exactly once');
  assert.equal(result.sections.length, plan.sections.length + 1, 'every section plus the legend');
  assert.equal(result.board, plan.title);

  const sections = figma.nodes.filter((n) => n.type === 'SECTION');
  assert.equal(sections.length, plan.sections.length + 1);
  for (const s of sections) {
    assert.ok(s.children.length > 0, `section "${s.name}" has no content`);
    // Every child fits inside its section: the layout math is real, not hoped for.
    for (const c of s.children) {
      assert.ok(c.x >= 0 && c.y >= 0, `child of "${s.name}" is outside the section origin`);
      assert.ok(c.x + c.width <= s.width + 0.01, `child of "${s.name}" overflows width`);
      assert.ok(c.y + c.height <= s.height + 0.01, `child of "${s.name}" overflows height`);
    }
  }
  assert.equal(figma.connectors.length, plan.connectors.length);
  for (const c of figma.connectors) {
    assert.ok(c.connectorStart.endpointNodeId, 'connector start unattached');
    assert.ok(c.connectorEnd.endpointNodeId, 'connector end unattached');
  }
});

test('the mock catches the failure modes the real API would', async () => {
  const figma = createMockFigma();
  // characters before the font is loaded
  await assert.rejects(
    runPluginScript(`(async () => { const t = figma.createText(); t.characters = 'x'; figma.closePlugin(); })()`, figma),
    /unloaded font/);
  // connector label before fontName is set
  const f2 = createMockFigma();
  await assert.rejects(
    runPluginScript(`(async () => { const c = figma.createConnector(); c.text.characters = 'x'; figma.closePlugin(); })()`, f2),
    /before text.fontName/);
  // createPage is not a FigJam API
  const f3 = createMockFigma();
  await assert.rejects(
    runPluginScript(`(async () => { figma.createPage(); figma.closePlugin(); })()`, f3),
    /createPage/);
});

test('renderPlanReport names every unsourced section rather than hiding it', () => {
  const report = renderPlanReport(planFromWorkflow('customer-discovery'));
  assert.match(report, /## Section inventory/);
  assert.match(report, /## Not seeded/);
  assert.match(report, /Open questions/);
});

test('every workflow either builds a valid script or refuses with a reason', () => {
  const dir = path.join(REPO_ROOT, '_workflows');
  const slugs = fs.readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => path.basename(f, '.md'));
  assert.ok(slugs.length >= 10);
  let built = 0;
  let refused = 0;
  for (const slug of slugs) {
    let plan;
    try {
      plan = planFromWorkflow(slug);
    } catch (e) {
      // A refusal must explain itself and point somewhere useful.
      assert.match(e.message, /no "### Step N:" headings/, `${slug}: unhelpful refusal`);
      assert.match(e.message, /--skill/, `${slug}: refusal offers no alternative`);
      refused += 1;
      continue;
    }
    const script = renderPluginScript(plan);
    assert.doesNotThrow(() => new Function('figma', `return (${script.trim().replace(/;\s*$/, '')});`),
      `${slug}: generated invalid JavaScript`);
    assert.deepEqual(assertExactPaletteChannels(script), [], `${slug}: non-palette color`);
    built += 1;
  }
  assert.ok(built >= 8, `expected most workflows to build, got ${built}`);
  assert.ok(refused > 0, 'expected the honest-refusal path to be exercised');
});

test('every catalog skill produces a script that runs against the mock', async () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'skill-manifest.json'), 'utf8'));
  let checked = 0;
  for (const entry of manifest.entries) {
    const plan = planFromSkill(entry.name);
    const script = renderPluginScript(plan);
    const figma = createMockFigma();
    const { result } = await runPluginScript(script, figma);
    assert.equal(figma._closed, 1, `${entry.name}: closePlugin not called exactly once`);
    assert.ok(result.sections.length >= 3, `${entry.name}: too few sections`);
    // Layout must hold for every skill, not just the one in the happy-path test.
    for (const s of figma.nodes.filter((n) => n.type === 'SECTION')) {
      for (const c of s.children) {
        assert.ok(c.y + c.height <= s.height + 0.01,
          `${entry.name}: content overflows section "${s.name}"`);
      }
    }
    checked += 1;
  }
  assert.equal(checked, manifest.entries.length);
  assert.ok(checked >= 71, `expected the full catalog, checked ${checked}`);
});
