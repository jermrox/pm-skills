#!/usr/bin/env node
// PM-Skills local dashboard server. Zero dependencies; Node 18+.
//
//   npm run dashboard        (or: node dashboard/server.mjs [port])
//
// Binds to 127.0.0.1 only. Serves the UI from dashboard/public/ and a small
// JSON API over the repo's skills, agents, and workflows. Local agents are
// written to .claude/agents/ (gitignored) where Claude Code discovers them.

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, loadSkills, loadAgents, loadWorkflows } from './lib/catalog.mjs';
import {
  createLocalAgent, deleteLocalAgent, cloneRepoAgent, setAgentSkills,
  getAgentSkills, validAgentName, ALLOWED_TOOLS, ALLOWED_MODELS,
} from './lib/agent-writer.mjs';

const PORT = Number(process.argv[2] || process.env.PM_DASHBOARD_PORT || 4680);
const PUBLIC_DIR = path.join(REPO_ROOT, 'dashboard', 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function json(res, status, payload) {
  const body = JSON.stringify(payload, null, 2);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 256 * 1024) { reject(new Error('Payload too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function serveStatic(res, urlPath) {
  const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const filePath = path.resolve(PUBLIC_DIR, rel);
  if (!filePath.startsWith(PUBLIC_DIR)) return json(res, 403, { error: 'Forbidden' });
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return json(res, 404, { error: 'Not found' });
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
  res.end(fs.readFileSync(filePath));
}

function knownSkillNames() {
  return new Set(loadSkills().skills.map((s) => s.name));
}

async function handleApi(req, res, url) {
  if (req.method === 'GET' && url.pathname === '/api/data') {
    const { catalog, skills } = loadSkills();
    return json(res, 200, {
      catalog,
      skills,
      agents: loadAgents(),
      workflows: loadWorkflows(),
      allowedTools: ALLOWED_TOOLS,
      allowedModels: ALLOWED_MODELS,
      repoRoot: REPO_ROOT,
    });
  }

  if (req.method === 'POST' && url.pathname === '/api/agents') {
    const body = await readBody(req);
    const known = knownSkillNames();
    const skills = (body.skills || []).filter((s) => known.has(s));
    const { file } = createLocalAgent({ ...body, skills });
    return json(res, 201, { ok: true, file: path.relative(REPO_ROOT, file) });
  }

  if (req.method === 'POST' && url.pathname === '/api/agents/clone') {
    const body = await readBody(req);
    const result = cloneRepoAgent(body.name);
    return json(res, 200, { ok: true, name: result.name, existed: result.existed, file: path.relative(REPO_ROOT, result.file) });
  }

  if (req.method === 'POST' && url.pathname === '/api/agents/skills') {
    const body = await readBody(req);
    const { agent, skill, action } = body;
    if (!validAgentName(agent)) return json(res, 400, { error: 'Invalid agent name' });
    if (!knownSkillNames().has(skill)) return json(res, 400, { error: `Unknown skill: ${skill}` });
    const current = new Set(getAgentSkills(agent));
    if (action === 'remove') current.delete(skill); else current.add(skill);
    const updated = setAgentSkills(agent, [...current]);
    return json(res, 200, { ok: true, agent, skills: updated });
  }

  if (req.method === 'DELETE' && /^\/api\/agents\/[a-z0-9-]+$/.test(url.pathname)) {
    const name = url.pathname.split('/').pop();
    deleteLocalAgent(name);
    return json(res, 200, { ok: true });
  }

  return json(res, 404, { error: 'Unknown API route' });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  try {
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    return serveStatic(res, url.pathname);
  } catch (err) {
    return json(res, 400, { error: err.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`PM-Skills dashboard running at http://127.0.0.1:${PORT}`);
  console.log('Local agents are written to .claude/agents/ (gitignored).');
});
