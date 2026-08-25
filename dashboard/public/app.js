/* PM-Skills dashboard frontend. Plain JS, no dependencies. */

let DATA = { skills: [], agents: [], workflows: [], catalog: {}, allowedTools: [], allowedModels: [] };

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function toast(msg, isError) {
  const t = $('#toast');
  t.textContent = msg;
  t.style.background = isError ? 'var(--danger)' : 'var(--accent2)';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

async function api(path, opts) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
  return body;
}

async function refresh() {
  DATA = await api('/api/data');
  const c = DATA.catalog || {};
  $('#stats').textContent =
    `${c.skills ?? DATA.skills.length} skills | ${DATA.agents.length} agents | ${DATA.workflows.length} workflows`;
  renderSkills();
  renderAgents();
  renderBuilderOptions();
  renderWorkflows();
  renderFigjamSources();
  renderBuilderPreview();
}

/* ---------- Tabs ---------- */
$$('nav button').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('nav button').forEach((b) => b.classList.toggle('active', b === btn));
    ['skills', 'agents', 'builder', 'workflows', 'figjam'].forEach((t) => {
      $(`#tab-${t}`).hidden = t !== btn.dataset.tab;
    });
  });
});

/* ---------- Skills tab ---------- */
function skillBadges(s) {
  const badges = [`<span class="badge ${s.group}">${s.group}</span>`];
  if (s.phase) badges.push(`<span class="badge phase-${s.phase}">${s.phase}</span>`);
  if (s.family) badges.push(`<span class="badge">${s.family}</span>`);
  badges.push(`<span class="badge">v${s.version}</span>`);
  return badges.join('');
}

function renderSkills() {
  const q = $('#skill-search').value.toLowerCase();
  const group = $('#skill-group').value;
  const phase = $('#skill-phase').value;
  const grid = $('#skills-grid');
  const filtered = DATA.skills.filter((s) =>
    (!group || s.group === group) &&
    (!phase || s.phase === phase) &&
    (!q || s.name.includes(q) || s.description.toLowerCase().includes(q)));
  grid.innerHTML = filtered.map((s) => `
    <div class="card">
      <h3>${s.name} ${skillBadges(s)}</h3>
      <p>${escapeHtml(s.description)}</p>
      <div class="row" style="margin-top: auto;">
        <button class="action" data-apply="${s.name}">Apply to agent</button>
        <button class="action secondary" data-copyskill="${s.name}">Copy invoke prompt</button>
      </div>
    </div>`).join('') || '<div class="empty">No skills match.</div>';
  grid.querySelectorAll('[data-apply]').forEach((b) =>
    b.addEventListener('click', () => openApplyDialog(b.dataset.apply)));
  grid.querySelectorAll('[data-copyskill]').forEach((b) =>
    b.addEventListener('click', () => {
      const s = DATA.skills.find((x) => x.name === b.dataset.copyskill);
      copy(`Use the ${s.name} pm-skill (read ${s.path}/SKILL.md and follow its output contract) to produce this artifact for me:\n\n<describe your context here>`);
    }));
}
['#skill-search', '#skill-group', '#skill-phase'].forEach((sel) =>
  $(sel).addEventListener('input', renderSkills));

/* ---------- Apply dialog ---------- */
function openApplyDialog(skillName) {
  $('#apply-skill-name').textContent = skillName;
  const list = $('#apply-agent-list');
  list.innerHTML = DATA.agents.map((a) => `
    <button class="action secondary" data-agent="${a.name}" data-source="${a.source}">
      ${a.name} <span class="badge ${a.source}">${a.source}</span>
      ${a.skills.includes(skillName) ? '<span class="badge">already applied</span>' : ''}
    </button>`).join('') || '<div class="empty">No agents yet. Create one in Agent Builder.</div>';
  list.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', async () => {
      try {
        let target = b.dataset.agent;
        if (b.dataset.source === 'repo') {
          const cloned = await api('/api/agents/clone', { method: 'POST', body: JSON.stringify({ name: target }) });
          target = cloned.name;
          toast(`Cloned to local agent ${target}`);
        }
        await api('/api/agents/skills', { method: 'POST', body: JSON.stringify({ agent: target, skill: skillName, action: 'add' }) });
        toast(`Applied ${skillName} to ${target}`);
        $('#apply-dialog').close();
        refresh();
      } catch (e) { toast(e.message, true); }
    }));
  $('#apply-dialog').showModal();
}

/* ---------- Agents tab ---------- */
function launchPrompt(a) {
  const skills = a.skills.length ? `\nApply these pm-skills as needed: ${a.skills.join(', ')}.` : '';
  return `Use the ${a.name} agent (defined in ${a.file}) for this task.${skills}\n\nTask: <describe your task here>`;
}

function renderAgents() {
  const grid = $('#agents-grid');
  grid.innerHTML = DATA.agents.map((a) => `
    <div class="card">
      <h3>${a.name} <span class="badge ${a.source}">${a.source}</span> <span class="badge">${a.model}</span></h3>
      <p>${escapeHtml(a.description.slice(0, 320))}${a.description.length > 320 ? '...' : ''}</p>
      <div class="row">${a.tools.map((t) => `<span class="chip">${t}</span>`).join('')}</div>
      ${a.skills.length ? `<div class="row">${a.skills.map((s) => `
        <span class="chip">${s}${a.source === 'local' ? ` <button title="Remove" data-unapply="${a.name}|${s}">x</button>` : ''}</span>`).join('')}</div>` : ''}
      <div class="row" style="margin-top: auto;">
        <button class="action secondary" data-launch="${a.name}">Copy launch prompt</button>
        ${a.source === 'repo'
          ? `<button class="action" data-clone="${a.name}">Clone to local</button>`
          : `<button class="action danger" data-del="${a.name}">Delete</button>`}
      </div>
    </div>`).join('') || '<div class="empty">No agents found.</div>';
  grid.querySelectorAll('[data-launch]').forEach((b) =>
    b.addEventListener('click', () => copy(launchPrompt(DATA.agents.find((a) => a.name === b.dataset.launch)))));
  grid.querySelectorAll('[data-clone]').forEach((b) =>
    b.addEventListener('click', async () => {
      try {
        const r = await api('/api/agents/clone', { method: 'POST', body: JSON.stringify({ name: b.dataset.clone }) });
        toast(r.existed ? `${r.name} already exists` : `Cloned as ${r.name}`);
        refresh();
      } catch (e) { toast(e.message, true); }
    }));
  grid.querySelectorAll('[data-del]').forEach((b) =>
    b.addEventListener('click', async () => {
      if (!confirm(`Delete local agent ${b.dataset.del}?`)) return;
      try { await api(`/api/agents/${b.dataset.del}`, { method: 'DELETE' }); toast('Deleted'); refresh(); }
      catch (e) { toast(e.message, true); }
    }));
  grid.querySelectorAll('[data-unapply]').forEach((b) =>
    b.addEventListener('click', async () => {
      const [agent, skill] = b.dataset.unapply.split('|');
      try {
        await api('/api/agents/skills', { method: 'POST', body: JSON.stringify({ agent, skill, action: 'remove' }) });
        toast(`Removed ${skill}`); refresh();
      } catch (e) { toast(e.message, true); }
    }));
}

/* ---------- Agent Builder ---------- */
const builderState = { tools: new Set(['Read', 'Grep', 'Glob']), skills: new Set() };

function renderBuilderOptions() {
  const modelSel = $('#b-model');
  if (!modelSel.options.length) {
    modelSel.innerHTML = DATA.allowedModels.map((m) => `<option>${m}</option>`).join('');
  }
  $('#b-tools').innerHTML = DATA.allowedTools.map((t) => `
    <label><input type="checkbox" value="${t}" ${builderState.tools.has(t) ? 'checked' : ''}> ${t}</label>`).join('');
  $('#b-tools').querySelectorAll('input').forEach((cb) =>
    cb.addEventListener('change', () => {
      cb.checked ? builderState.tools.add(cb.value) : builderState.tools.delete(cb.value);
      renderBuilderPreview();
    }));
  renderBuilderSkills();
}

function renderBuilderSkills() {
  const q = ($('#b-skill-search').value || '').toLowerCase();
  $('#b-skills').innerHTML = DATA.skills
    .filter((s) => !q || s.name.includes(q))
    .map((s) => `<span class="chip" data-skill="${s.name}" style="cursor: pointer; ${builderState.skills.has(s.name) ? 'outline: 1px solid var(--accent2);' : ''}">${s.name}</span>`)
    .join('');
  $('#b-skills').querySelectorAll('[data-skill]').forEach((chip) =>
    chip.addEventListener('click', () => {
      const n = chip.dataset.skill;
      builderState.skills.has(n) ? builderState.skills.delete(n) : builderState.skills.add(n);
      renderBuilderSkills();
      renderBuilderPreview();
    }));
}
$('#b-skill-search').addEventListener('input', renderBuilderSkills);

function builderInput() {
  return {
    name: $('#b-name').value.trim(),
    description: $('#b-desc').value.trim(),
    focus: $('#b-focus').value.trim(),
    model: $('#b-model').value,
    memory: $('#b-memory').value,
    tools: [...builderState.tools],
    skills: [...builderState.skills].sort(),
  };
}

function renderBuilderPreview() {
  const i = builderInput();
  const name = i.name || 'my-pm-agent';
  const tools = i.tools.length ? i.tools.join(', ') : 'Read, Grep, Glob';
  const skills = i.skills.length
    ? i.skills.map((s) => `- ${s}`).join('\n')
    : '- (none applied yet)';
  $('#b-preview').textContent = `---
name: ${name}
description: |
  ${(i.description || 'Describe when Claude should delegate to this agent.').split('\n').join('\n  ')}
tools: ${tools}
model: ${i.model || 'inherit'}
memory: ${i.memory}
---

You are \`${name}\`, a PM sub-agent built with the pm-skills framework.

## Identity
- Local sub-agent created via the pm-skills dashboard
- Tools: ${tools}; the Agent tool is intentionally excluded (chain depth rule D14)

## Focus
${i.focus || i.description || '...'}

## Skill Access
<!-- pm-dashboard:skills:start -->
${skills}
<!-- pm-dashboard:skills:end -->

(plus What You Do / What You Do NOT Do sections)`;
}
['#b-name', '#b-desc', '#b-focus', '#b-model', '#b-memory'].forEach((sel) =>
  $(sel).addEventListener('input', renderBuilderPreview));

$('#b-create').addEventListener('click', async () => {
  const i = builderInput();
  if (!/^[a-z][a-z0-9-]{1,63}$/.test(i.name)) return toast('Name must be lowercase-hyphenated, e.g. pm-launch-writer', true);
  if (!i.description) return toast('Description is required (it drives delegation)', true);
  try {
    const r = await api('/api/agents', { method: 'POST', body: JSON.stringify(i) });
    $('#b-status').textContent = `Created ${r.file}`;
    toast(`Agent ${i.name} created`);
    refresh();
  } catch (e) { toast(e.message, true); }
});

/* ---------- Workflows tab ---------- */
function renderWorkflows() {
  $('#workflows-grid').innerHTML = DATA.workflows.map((w) => `
    <div class="card">
      <h3>${w.title} ${w.mermaid ? '<span class="badge">mermaid</span>' : ''}</h3>
      <p>${escapeHtml(w.summary)}</p>
      ${w.skillsNote ? `<p style="font-size: 11.8px;">Skills: ${escapeHtml(w.skillsNote)}</p>` : ''}
      <div class="row" style="margin-top: auto;">
        <button class="action secondary" data-wf="${w.slug}">Copy run prompt</button>
        <button class="action" data-wfjam="${w.slug}">Open in FigJam Studio</button>
      </div>
    </div>`).join('') || '<div class="empty">No workflows found.</div>';
  $('#workflows-grid').querySelectorAll('[data-wf]').forEach((b) =>
    b.addEventListener('click', () => {
      const w = DATA.workflows.find((x) => x.slug === b.dataset.wf);
      copy(`Run the ${w.title} pm-skills workflow. Read ${w.file} and walk me through it step by step, invoking each listed skill in order and pausing for my go/no-go between steps.\n\nContext: <describe your product context here>`);
    }));
  $('#workflows-grid').querySelectorAll('[data-wfjam]').forEach((b) =>
    b.addEventListener('click', () => {
      $$('nav button').find((n) => n.dataset.tab === 'figjam').click();
      $('#fj-source-type').value = 'workflow';
      renderFigjamSources();
      $('#fj-source').value = b.dataset.wfjam;
      $('#fj-generate').click();
    }));
}

/* ---------- FigJam Studio ---------- */
function renderFigjamSources() {
  const type = $('#fj-source-type').value;
  const options =
    type === 'workflow' ? DATA.workflows.map((w) => [w.slug, w.title]) :
    type === 'skill' ? DATA.skills.map((s) => [s.name, s.name]) :
    DATA.agents.map((a) => [a.name, `${a.name} (${a.source})`]);
  $('#fj-source').innerHTML = options.map(([v, l]) => `<option value="${v}">${l}</option>`).join('');
}
$('#fj-source-type').addEventListener('change', renderFigjamSources);

function figjamMermaid(type, item, style) {
  if (type === 'workflow' && item.mermaid && style === 'diagram') return item.mermaid;
  if (type === 'skill') {
    return `graph TD\n    A["Inputs: context, evidence, constraints"] --> B["${item.name}"]\n    B --> C["Draft artifact"]\n    C --> D["Team review on stickies"]\n    D --> E["Revise with pm-critic findings"]\n    E --> F["Final artifact"]`;
  }
  if (type === 'agent') {
    const skills = item.skills.length ? item.skills : ['(apply skills first)'];
    return `graph LR\n    U["User request"] --> A["${item.name}"]\n${skills.map((s, i) => `    A --> S${i}["${s}"]`).join('\n')}\n    ${skills.map((_, i) => `S${i}`).join(' & ')} --> O["PM artifact"]`;
  }
  return `graph LR\n    A["Kickoff"] --> B["${item.title || item.name}"] --> C["Outputs"]`;
}

function figjamPrompt(type, item, style) {
  const styleText = {
    workshop: 'a workshop board: one section per step, each section seeded with sticky notes for prompts, an area for participant stickies, and a dot-voting zone (see the tool-note-and-vote skill for facilitation rules)',
    diagram: 'a connected flow diagram of the steps with labeled arrows',
    kanban: 'kanban-style columns (one column per step or phase) with card placeholders',
  }[style];
  if (type === 'skill') {
    return `Using the Figma MCP server, create a FigJam board for a working session around the pm-skills skill "${item.name}".

1. First read skills/${item.name}/SKILL.md in this repo to learn the skill's inputs and output contract.
2. Then use the FigJam tools (load the figma-use-figjam skill first if available, otherwise read skill://figma/figma-use-figjam/SKILL.md) to build ${styleText}.
3. Board sections: (a) Context and inputs the skill needs, (b) one section per major element of the skill's output template, (c) Open questions, (d) Next steps.
4. Seed each section with 2-3 example sticky notes drawn from the skill's EXAMPLE.md if present.
5. Give me the FigJam file link when done.`;
  }
  if (type === 'agent') {
    return `Using the Figma MCP server, create a FigJam kickoff board for the pm-skills agent "${item.name}" (defined in ${item.file}).

1. Read the agent definition to learn its focus and applied skills${item.skills.length ? ` (${item.skills.join(', ')})` : ''}.
2. Use the FigJam tools (load the figma-use-figjam skill first if available) to build ${styleText}.
3. Lay out one swimlane per applied skill showing: required inputs, the artifact it produces, and who reviews it.
4. Add a parking-lot section for questions the agent should NOT answer alone (per its What You Do NOT Do rules).
5. Give me the FigJam file link when done.`;
  }
  return `Using the Figma MCP server, create a FigJam board for the pm-skills "${item.title}" workflow.

1. First read ${item.file} in this repo to learn the workflow's steps, skills, and gates.
2. Then use the FigJam tools (load the figma-use-figjam skill first if available, otherwise read skill://figma/figma-use-figjam/SKILL.md) to build ${styleText}.
3. One section per workflow step, labeled with the pm-skill that runs there; connect steps in order and mark the go/no-go gates.
4. Add a "Working area" of blank stickies next to each step for the team, and a legend explaining the flow.
5. Give me the FigJam file link when done.`;
}

$('#fj-generate').addEventListener('click', () => {
  const type = $('#fj-source-type').value;
  const style = $('#fj-style').value;
  const key = $('#fj-source').value;
  const item =
    type === 'workflow' ? DATA.workflows.find((w) => w.slug === key) :
    type === 'skill' ? DATA.skills.find((s) => s.name === key) :
    DATA.agents.find((a) => a.name === key);
  if (!item) return toast('Pick a source first', true);
  $('#fj-prompt').textContent = figjamPrompt(type, item, style);
  $('#fj-mermaid').textContent = figjamMermaid(type, item, style);
  $('#fj-output').hidden = false;
});

$$('[data-copy]').forEach((b) =>
  b.addEventListener('click', () => copy($(`#${b.dataset.copy}`).textContent)));

/* ---------- Utils ---------- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function copy(text) {
  navigator.clipboard.writeText(text)
    .then(() => toast('Copied to clipboard'))
    .catch(() => toast('Copy failed (clipboard blocked)', true));
}

refresh().catch((e) => toast(`Failed to load: ${e.message}`, true));
