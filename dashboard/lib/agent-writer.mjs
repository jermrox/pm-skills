// Agent writer: creates and updates LOCAL agents in .claude/agents/ following
// the same framework as the repo's curated sub-agents (frontmatter with name,
// description, tools, model, memory; body with Identity / What You Do sections;
// a managed Skill Access block the dashboard can rewrite).
//
// Repo agents in agents/ are never mutated. Applying a skill to a repo agent
// first clones it into .claude/agents/ (gitignored, picked up by Claude Code).

import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from './frontmatter.mjs';
import { LOCAL_AGENTS_DIR, REPO_AGENTS_DIR, extractAppliedSkills } from './catalog.mjs';

const SKILLS_BLOCK_START = '<!-- pm-dashboard:skills:start -->';
const SKILLS_BLOCK_END = '<!-- pm-dashboard:skills:end -->';

// D14 chain-depth rule: sub-agents must not carry the Agent tool unless
// allowlisted in agents/_chain-permitted.yaml. The dashboard never grants it.
export const ALLOWED_TOOLS = ['Read', 'Grep', 'Glob', 'Write', 'Edit', 'Bash', 'WebSearch', 'WebFetch', 'Skill'];
export const ALLOWED_MODELS = ['inherit', 'sonnet', 'opus', 'haiku'];

export function validAgentName(name) {
  return typeof name === 'string' && /^[a-z][a-z0-9-]{1,63}$/.test(name);
}

function localAgentPath(name) {
  if (!validAgentName(name)) throw new Error(`Invalid agent name: ${name}`);
  return path.join(LOCAL_AGENTS_DIR, `${name}.md`);
}

function skillsBlock(skills) {
  const items = skills.length
    ? skills.map((s) => `- ${s}`).join('\n')
    : '- (none applied yet)';
  return `${SKILLS_BLOCK_START}\n${items}\n${SKILLS_BLOCK_END}`;
}

export function renderAgentMarkdown({ name, description, tools, model, memory, focus, skills }) {
  const safeTools = (tools || []).filter((t) => ALLOWED_TOOLS.includes(t));
  const toolLine = safeTools.length ? safeTools.join(', ') : 'Read, Grep, Glob';
  const safeModel = ALLOWED_MODELS.includes(model) ? model : 'inherit';
  const descLines = String(description || '').trim().split('\n').map((l) => `  ${l}`.trimEnd()).join('\n');
  const skillLines = (skills || []).length
    ? (skills || []).map((s) => `- Invoke \`${s}\` for its artifact contract; do not re-derive the template from memory.`).join('\n')
    : '- No skills applied yet. Use the dashboard Skills tab to apply some.';
  return `---
name: ${name}
description: |
${descLines}
tools: ${toolLine}
model: ${safeModel}
memory: ${memory || 'none'}
---

You are \`${name}\`, a PM sub-agent built with the pm-skills framework.

## Identity

- Local sub-agent created via the pm-skills dashboard
- Single-turn lifetime, isolated context window
- Tools: ${toolLine}; the \`Agent\` tool is intentionally excluded (chain depth rule D14)
- Default memory: ${memory || 'none'}

## Focus

${String(focus || description || '').trim()}

## Skill Access

Apply these pm-skills when producing artifacts. Read each skill's SKILL.md at
\`skills/<skill-name>/SKILL.md\` before producing its artifact, and follow its
output contract exactly.

${skillsBlock(skills || [])}

## What You Do

1. Read the user's input and the applied skills' SKILL.md contracts
2. Produce the requested PM artifact following the skill's template and rules
3. Flag assumptions explicitly; never fabricate metrics, quotes, or baselines

## What You Do NOT Do

- Do NOT spawn other agents (no \`Agent\` tool)
- Do NOT invent evidence; label assumptions honestly
- Do NOT skip a skill's When NOT to Use guidance
`;
}

export function createLocalAgent(input) {
  const { name } = input;
  if (!validAgentName(name)) throw new Error('Agent name must be lowercase letters, digits, and hyphens (e.g. pm-launch-writer).');
  fs.mkdirSync(LOCAL_AGENTS_DIR, { recursive: true });
  const filePath = localAgentPath(name);
  if (fs.existsSync(filePath)) throw new Error(`Local agent "${name}" already exists.`);
  const markdown = renderAgentMarkdown(input);
  fs.writeFileSync(filePath, markdown, 'utf8');
  return { file: filePath, markdown };
}

export function deleteLocalAgent(name) {
  const filePath = localAgentPath(name);
  if (!fs.existsSync(filePath)) throw new Error(`Local agent "${name}" not found.`);
  fs.unlinkSync(filePath);
}

export function cloneRepoAgent(name) {
  if (!validAgentName(name)) throw new Error(`Invalid agent name: ${name}`);
  const src = path.join(REPO_AGENTS_DIR, `${name}.md`);
  if (!fs.existsSync(src)) throw new Error(`Repo agent "${name}" not found.`);
  const localName = `${name}-local`;
  const dest = localAgentPath(localName);
  if (fs.existsSync(dest)) return { name: localName, file: dest, existed: true };
  fs.mkdirSync(LOCAL_AGENTS_DIR, { recursive: true });
  let raw = fs.readFileSync(src, 'utf8');
  // Rename in frontmatter and append a managed Skill Access block.
  raw = raw.replace(/^(---\r?\n[\s\S]*?name:\s*)([^\r\n]+)/, `$1${localName}`);
  if (!raw.includes(SKILLS_BLOCK_START)) {
    raw += `\n## Skill Access (dashboard-managed)\n\n${skillsBlock([])}\n`;
  }
  fs.writeFileSync(dest, raw, 'utf8');
  return { name: localName, file: dest, existed: false };
}

export function setAgentSkills(name, skills) {
  const filePath = localAgentPath(name);
  if (!fs.existsSync(filePath)) throw new Error(`Local agent "${name}" not found. Repo agents must be cloned first.`);
  let raw = fs.readFileSync(filePath, 'utf8');
  const unique = [...new Set(skills)].sort();
  if (raw.includes(SKILLS_BLOCK_START) && raw.includes(SKILLS_BLOCK_END)) {
    const start = raw.indexOf(SKILLS_BLOCK_START);
    const end = raw.indexOf(SKILLS_BLOCK_END) + SKILLS_BLOCK_END.length;
    raw = raw.slice(0, start) + skillsBlock(unique) + raw.slice(end);
  } else {
    raw += `\n## Skill Access (dashboard-managed)\n\n${skillsBlock(unique)}\n`;
  }
  fs.writeFileSync(filePath, raw, 'utf8');
  return unique;
}

export function getAgentSkills(name) {
  const filePath = localAgentPath(name);
  if (!fs.existsSync(filePath)) return [];
  const { body } = parseFrontmatter(fs.readFileSync(filePath, 'utf8'));
  return extractAppliedSkills(body);
}
