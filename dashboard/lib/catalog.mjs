// Catalog loader: reads skills from skill-manifest.json, agents from agents/
// (repo, read-only) and .claude/agents/ (local, editable), and workflow
// metadata from _workflows/*.md. Everything is read fresh per request so the
// dashboard always reflects what is on disk.

import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, toolsToList } from './frontmatter.mjs';

export const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
export const LOCAL_AGENTS_DIR = path.join(REPO_ROOT, '.claude', 'agents');
export const REPO_AGENTS_DIR = path.join(REPO_ROOT, 'agents');

const SKILLS_BLOCK_START = '<!-- pm-dashboard:skills:start -->';
const SKILLS_BLOCK_END = '<!-- pm-dashboard:skills:end -->';

export function loadSkills() {
  const manifestPath = path.join(REPO_ROOT, 'skill-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  return {
    catalog: manifest.catalog,
    skills: manifest.entries.map((e) => ({
      name: e.name,
      description: e.description,
      version: e.version,
      group: e.group,
      phase: e.phase,
      family: e.family,
      path: e.path,
      sample: e.sample || null,
    })),
  };
}

export function extractAppliedSkills(body) {
  const start = body.indexOf(SKILLS_BLOCK_START);
  const end = body.indexOf(SKILLS_BLOCK_END);
  if (start === -1 || end === -1 || end < start) return [];
  return body
    .slice(start + SKILLS_BLOCK_START.length, end)
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean);
}

function readAgentFile(filePath, source) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, body } = parseFrontmatter(raw);
  return {
    name: data.name || path.basename(filePath, '.md'),
    description: data.description || '',
    tools: toolsToList(data.tools),
    model: data.model || 'inherit',
    memory: data.memory || 'none',
    source,
    file: path.relative(REPO_ROOT, filePath),
    skills: extractAppliedSkills(body),
  };
}

export function loadAgents() {
  const agents = [];
  if (fs.existsSync(REPO_AGENTS_DIR)) {
    for (const f of fs.readdirSync(REPO_AGENTS_DIR).sort()) {
      if (!f.endsWith('.md') || f.startsWith('_')) continue;
      try { agents.push(readAgentFile(path.join(REPO_AGENTS_DIR, f), 'repo')); } catch { /* skip unreadable */ }
    }
  }
  if (fs.existsSync(LOCAL_AGENTS_DIR)) {
    for (const f of fs.readdirSync(LOCAL_AGENTS_DIR).sort()) {
      if (!f.endsWith('.md')) continue;
      try { agents.push(readAgentFile(path.join(LOCAL_AGENTS_DIR, f), 'local')); } catch { /* skip unreadable */ }
    }
  }
  return agents;
}

export function loadWorkflows() {
  const dir = path.join(REPO_ROOT, '_workflows');
  if (!fs.existsSync(dir)) return [];
  const workflows = [];
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith('.md') || f === 'README.md') continue;
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const blockquote = /^>\s*(.+)$/m.exec(body);
    const skillsRow = /\|\s*\*\*Skills\*\*\s*\|\s*([^|]+)\|/.exec(body);
    const mermaid = /```mermaid\r?\n([\s\S]*?)```/.exec(body);
    workflows.push({
      slug: path.basename(f, '.md'),
      title: data.title || path.basename(f, '.md'),
      summary: blockquote ? blockquote[1].trim() : '',
      skillsNote: skillsRow ? skillsRow[1].trim() : '',
      mermaid: mermaid ? mermaid[1].trim() : null,
      file: path.join('_workflows', f),
    });
  }
  return workflows;
}
