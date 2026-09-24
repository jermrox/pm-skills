import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, toolsToList } from './frontmatter.mjs';
import { loadSkills, loadAgents, loadWorkflows, extractAppliedSkills, LOCAL_AGENTS_DIR } from './catalog.mjs';
import { renderAgentMarkdown, createLocalAgent, deleteLocalAgent, setAgentSkills, getAgentSkills, validAgentName } from './agent-writer.mjs';

test('parseFrontmatter handles block scalar descriptions and comma tools', () => {
  const md = `---\nname: pm-critic\ndescription: |\n  Line one.\n  Line two.\ntools: Read, Grep, Glob\nmodel: sonnet\n---\nBody here.`;
  const { data, body } = parseFrontmatter(md);
  assert.equal(data.name, 'pm-critic');
  assert.equal(data.description, 'Line one.\nLine two.');
  assert.deepEqual(toolsToList(data.tools), ['Read', 'Grep', 'Glob']);
  assert.equal(body.trim(), 'Body here.');
});

test('loadSkills reads the manifest', () => {
  const { catalog, skills } = loadSkills();
  assert.ok(skills.length >= 60);
  assert.equal(catalog.skills, skills.length);
  assert.ok(skills.some((s) => s.name === 'foundation-persona'));
});

test('loadAgents parses repo agents', () => {
  const agents = loadAgents();
  const critic = agents.find((a) => a.name === 'pm-critic');
  assert.ok(critic);
  assert.equal(critic.source, 'repo');
  assert.ok(critic.tools.includes('Read'));
});

test('loadWorkflows extracts summary and mermaid', () => {
  const workflows = loadWorkflows();
  const td = workflows.find((w) => w.slug === 'triple-diamond');
  assert.ok(td);
  assert.ok(td.summary.length > 0);
  assert.ok(td.mermaid && td.mermaid.includes('graph'));
});

test('validAgentName enforces lowercase-hyphenated', () => {
  assert.ok(validAgentName('pm-launch-writer'));
  assert.ok(!validAgentName('Bad Name'));
  assert.ok(!validAgentName('../etc'));
});

test('agent create, apply skills, and delete round trip', () => {
  const name = 'dashboard-test-agent';
  const file = path.join(LOCAL_AGENTS_DIR, `${name}.md`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  try {
    createLocalAgent({ name, description: 'Test agent.', tools: ['Read', 'Agent'], model: 'sonnet', memory: 'none', skills: ['deliver-prd'] });
    const { data, body } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
    assert.equal(data.name, name);
    assert.ok(!toolsToList(data.tools).includes('Agent'), 'Agent tool must be stripped (D14)');
    assert.deepEqual(extractAppliedSkills(body), ['deliver-prd']);

    setAgentSkills(name, ['deliver-prd', 'foundation-persona']);
    assert.deepEqual(getAgentSkills(name), ['deliver-prd', 'foundation-persona']);

    setAgentSkills(name, ['foundation-persona']);
    assert.deepEqual(getAgentSkills(name), ['foundation-persona']);
  } finally {
    if (fs.existsSync(file)) deleteLocalAgent(name);
  }
  assert.ok(!fs.existsSync(file));
});

test('renderAgentMarkdown produces valid frontmatter', () => {
  const md = renderAgentMarkdown({ name: 'x-agent', description: 'Multi\nline desc.', tools: ['Read'], model: 'nope', memory: 'none', skills: [] });
  const { data } = parseFrontmatter(md);
  assert.equal(data.name, 'x-agent');
  assert.equal(data.model, 'inherit', 'unknown model falls back to inherit');
  assert.equal(data.description, 'Multi\nline desc.');
});
