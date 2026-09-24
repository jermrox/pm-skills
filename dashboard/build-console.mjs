#!/usr/bin/env node
// Builds the static PM Skills Console from the live repo catalog.
//
//   node dashboard/build-console.mjs
//
// Produces two files from one template:
//   dashboard/public/console.html   standalone document, opens by double-click
//   dashboard/public/console.body.html   body-only, for publishing as an Artifact
//
// Re-run after adding skills, agents, or workflows so the snapshot stays current.

import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, loadSkills, loadAgents, loadWorkflows } from './lib/catalog.mjs';
import { planFromWorkflow, planFromSkill } from './lib/figjam-plan.mjs';
import { renderPluginScript } from './lib/figjam-script.mjs';

const TEMPLATE = path.join(REPO_ROOT, 'dashboard', 'template', 'console.body.html');
const OUT_DIR = path.join(REPO_ROOT, 'dashboard', 'public');

export function buildCatalog() {
  const { catalog, skills } = loadSkills();
  return {
    catalog,
    skills,
    agents: loadAgents().map((a) => ({
      name: a.name, description: a.description, tools: a.tools,
      model: a.model, source: a.source, file: a.file, skills: a.skills,
    })),
    workflows: loadWorkflows().map((w) => ({
      slug: w.slug, title: w.title, summary: w.summary, skillsNote: w.skillsNote, file: w.file,
    })),
    // Pre-generated Plugin API scripts, so the static console hands over real
    // executable code rather than only a prompt describing a board.
    boardScripts: buildBoardScripts(skills, loadWorkflows()),
  };
}

/** One entry per source that can produce a board. Sources that cannot (a
 *  workflow with no step sequence) record the refusal reason instead, so the UI
 *  can say why rather than silently omitting them. */
export function buildBoardScripts(skills, workflows) {
  const out = { workflow: {}, skill: {} };
  for (const w of workflows) {
    try {
      out.workflow[w.slug] = { script: renderPluginScript(planFromWorkflow(w.slug)) };
    } catch (e) {
      out.workflow[w.slug] = { refused: e.message };
    }
  }
  for (const s of skills) {
    try {
      out.skill[s.name] = { script: renderPluginScript(planFromSkill(s.name)) };
    } catch (e) {
      out.skill[s.name] = { refused: e.message };
    }
  }
  return out;
}

export function renderBody(template, data) {
  if (!template.includes('/*__CATALOG__*/')) {
    throw new Error('Template is missing the /*__CATALOG__*/ placeholder.');
  }
  // JSON is injected into a <script> block, so a literal </script> inside any
  // description would end the block early. Escape the only sequence that can.
  const json = JSON.stringify(data).replace(/<\//g, '<\\/');
  return template.replace('/*__CATALOG__*/', json);
}

export function wrapDocument(body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
${body}
</body>
</html>
`;
}

function main() {
  const template = fs.readFileSync(TEMPLATE, 'utf8');
  const data = buildCatalog();
  const body = renderBody(template, data);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'console.body.html'), body, 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'console.html'), wrapDocument(body), 'utf8');
  console.log(
    `Built console: ${data.catalog.skills} skills, ${data.agents.length} agents, ${data.workflows.length} workflows`
  );
  console.log(`  ${path.relative(REPO_ROOT, path.join(OUT_DIR, 'console.html'))} (standalone)`);
  console.log(`  ${path.relative(REPO_ROOT, path.join(OUT_DIR, 'console.body.html'))} (artifact body)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
