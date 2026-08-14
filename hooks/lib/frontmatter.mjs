// hooks/lib/frontmatter.mjs - dependency-free reader for a handful of flat keys.
// NOT a YAML parser: an installed plugin's hooks have no node_modules, so they
// cannot import js-yaml. Handles scalar, quoted scalar, and inline-array values.

/** Return the text between the leading `---` fences, or '' if none. */
export function splitFrontmatter(fileText) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(fileText);
  return m ? m[1].trim() : '';
}

/** Strip a trailing YAML comment from a raw scalar value, quote- and list-aware.
 *
 *  YAML opens a comment at a `#` that begins the value or is preceded by
 *  whitespace, and never inside a quoted scalar or a flow sequence. Without this
 *  the reader returned the comment as part of the value, so a config copied from
 *  the documented example (`phase: deliver   # a Triple Diamond phase`) parsed as
 *  the whole line and every consumer rejected it as unrecognized - silently, since
 *  this reader fails open by design. Found by adversarial review at the v2.32.0
 *  cut, after the shipped docs had carried the unparseable example since v2.25.0.
 *
 *  Preserved on purpose: `issue#42` (no leading whitespace, so not a comment),
 *  `"Sprint #14 cleanup"` (inside quotes), and `[a, b] # note` (after the list). */
function stripComment(value) {
  const first = value[0];
  if (first === '"' || first === "'") {
    const end = value.indexOf(first, 1);
    return end === -1 ? value : value.slice(0, end + 1); // unterminated: leave as-is
  }
  if (first === '[') {
    const end = value.indexOf(']');
    return end === -1 ? value : value.slice(0, end + 1);
  }
  const m = /(^|\s)#/.exec(value);
  return m ? value.slice(0, m.index) : value;
}

/** Read a scalar field; drop any trailing comment, then strip matching surrounding
 *  quotes. null if absent, or if the value was nothing but a comment. */
export function getField(frontmatter, key) {
  const re = new RegExp('^\\s*' + key + ':\\s*(.+?)\\s*$', 'm');
  const m = re.exec(frontmatter);
  if (!m) return null;
  let v = stripComment(m[1].trim()).trim();
  if (!v) return null; // `key:   # only a comment` reads as unset, not as ''
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  return v;
}

/** Read an inline array field `key: [a, b]`. [] if absent or not an array.
 *  Strips matching quotes on each item, so `["em-dash"]` yields `em-dash`. */
export function getList(frontmatter, key) {
  const raw = getField(frontmatter, key);
  if (!raw || !raw.startsWith('[') || !raw.endsWith(']')) return [];
  return raw
    .slice(1, -1)
    .split(',')
    .map((s) => s.trim().replace(/^["']|["']$/g, '').trim())
    .filter(Boolean);
}
