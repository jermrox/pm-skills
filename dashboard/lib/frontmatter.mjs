// Minimal YAML frontmatter parser for agents/*.md files.
// Handles the subset this repo uses: scalar values, block scalars (| and >),
// inline lists ([a, b]), and comma-separated tool lists. Not a general YAML parser.

export function parseFrontmatter(markdown) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(markdown);
  if (!match) return { data: {}, body: markdown };
  const raw = match[1];
  const body = markdown.slice(match[0].length);
  const data = {};
  const lines = raw.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const kv = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) { i += 1; continue; }
    const key = kv[1];
    let value = kv[2].trim();
    if (value === '|' || value === '>' || value === '|-' || value === '>-') {
      const collected = [];
      i += 1;
      while (i < lines.length && (/^\s+/.test(lines[i]) || lines[i].trim() === '')) {
        collected.push(lines[i].replace(/^ {2}/, ''));
        i += 1;
      }
      data[key] = collected.join('\n').trim();
      continue;
    }
    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean);
    } else {
      data[key] = value.replace(/^['"]|['"]$/g, '');
    }
    i += 1;
  }
  return { data, body };
}

export function toolsToList(tools) {
  if (Array.isArray(tools)) return tools;
  if (typeof tools === 'string' && tools.length > 0) {
    return tools.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}
