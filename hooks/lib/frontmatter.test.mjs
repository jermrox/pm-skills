// hooks/lib/frontmatter.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { splitFrontmatter, getField, getList } from './frontmatter.mjs';

test('splitFrontmatter returns the block between leading --- fences', () => {
  const body = '---\nname: foo\nphase: deliver\n---\n# Heading\n';
  assert.equal(splitFrontmatter(body), 'name: foo\nphase: deliver');
});

test('splitFrontmatter returns empty string when no frontmatter', () => {
  assert.equal(splitFrontmatter('# no frontmatter\n'), '');
});

test('getField reads a scalar', () => {
  assert.equal(getField('name: foo\nphase: deliver', 'phase'), 'deliver');
});

test('getField returns null when absent', () => {
  assert.equal(getField('name: foo', 'phase'), null);
});

test('getField strips surrounding quotes', () => {
  assert.equal(getField('version: "1.0.0"', 'version'), '1.0.0');
});

test('getList parses an inline array', () => {
  assert.deepEqual(getList('guardrail_checks: [em-dash, placeholder]', 'guardrail_checks'), ['em-dash', 'placeholder']);
});

test('getList returns [] when absent', () => {
  assert.deepEqual(getList('guardrails: true', 'guardrail_checks'), []);
});

test('getList strips quotes on items (quoted-array YAML style)', () => {
  assert.deepEqual(getList('guardrail_checks: ["em-dash", "placeholder"]', 'guardrail_checks'), ['em-dash', 'placeholder']);
  assert.deepEqual(getList("guardrail_checks: ['em-dash']", 'guardrail_checks'), ['em-dash']);
});

// --- Trailing YAML comments -------------------------------------------------
// The documented config example carries inline comments on its scalar lines. Before
// v2.32.0 the reader returned the comment as part of the value, so every consumer
// rejected the documented example as unrecognized and failed open in silence.

test('getField drops a trailing comment on a bare scalar', () => {
  assert.equal(getField('phase: deliver   # a Triple Diamond phase, or omit', 'phase'), 'deliver');
  assert.equal(getField('memory_auto_append: false               # default', 'memory_auto_append'), 'false');
  assert.equal(getField('phase: deliver\t# tab-separated comment', 'phase'), 'deliver');
});

test('getField keeps a hash that is not a YAML comment', () => {
  // No preceding whitespace, so YAML does not open a comment here.
  assert.equal(getField('active_initiative: issue#42', 'active_initiative'), 'issue#42');
});

test('getField keeps a hash inside a quoted scalar, comment or not', () => {
  assert.equal(getField('active_initiative: "Sprint #14 cleanup"', 'active_initiative'), 'Sprint #14 cleanup');
  assert.equal(getField('active_initiative: "Sprint #14 cleanup"  # note', 'active_initiative'), 'Sprint #14 cleanup');
  assert.equal(getField("active_initiative: 'Sprint #14'  # note", 'active_initiative'), 'Sprint #14');
});

test('getField treats a comment-only value as unset, not empty string', () => {
  assert.equal(getField('phase:  # not decided yet', 'phase'), null);
});

test('getField leaves an unterminated quote alone rather than guessing', () => {
  assert.equal(getField('active_initiative: "unclosed', 'active_initiative'), '"unclosed');
});

test('getList drops a comment after the array without eating list items', () => {
  assert.deepEqual(getList('guardrail_checks: ["em-dash"]  # only this check', 'guardrail_checks'), ['em-dash']);
  assert.deepEqual(getList('guardrail_checks: ["issue #42"]  # hash inside an item', 'guardrail_checks'), ['issue #42']);
});
