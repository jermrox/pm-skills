// Pins the gen-site link-rewrite contract. Source files link the published docs
// by their real on-disk path so they resolve for a GitHub reader; gen-site
// collapses that prefix on copy so they also resolve inside the docs tree.
// Removing the Pattern S alias from check-root-doc-links.mjs is only safe while
// both halves hold, so both are asserted here.
import test from 'node:test';
import assert from 'node:assert/strict';
import { rewriteInternalPaths, rewriteWorkflowLinks } from './gen-site.mjs';

test('a SKILL.md link collapses to the skill page depth', () => {
  // skills/<dir>/SKILL.md -> docs/skills/<group>/<name>.md, two below the docs root.
  assert.equal(
    rewriteInternalPaths('See [matrix](../../site/src/content/docs/reference/sub-agent-compatibility.md).'),
    'See [matrix](../../reference/sub-agent-compatibility.md).');
});

test('a references/ link collapses to the SAME depth, because it is inlined', () => {
  // references/TEMPLATE.md sits a level deeper than SKILL.md, but its content is
  // inlined into the same skill page, so it normalises to the page's depth, not
  // its own. The old two-level-only rule left this form unrewritten and shipped
  // broken links on the live site.
  assert.equal(
    rewriteInternalPaths('- Guide: [x](../../../site/src/content/docs/guides/adversarial-review.md)'),
    '- Guide: [x](../../guides/adversarial-review.md)');
});

test('a workflow link collapses one level', () => {
  // _workflows/<name>.md -> docs/workflows/<name>.md, one below the docs root.
  assert.equal(
    rewriteWorkflowLinks('See [r](../site/src/content/docs/reference/runtime-components.md).'),
    'See [r](../reference/runtime-components.md).');
});

test('the retired docs/ form is no longer rewritten', () => {
  // Nothing should still be producing it, and if something does, it must show up
  // as a broken link rather than being silently repaired here.
  const retired = 'See [matrix](../../docs/reference/sub-agent-compatibility.md).';
  assert.equal(rewriteInternalPaths(retired), retired);
});

test('docs/internal links are left alone by both rewrites', () => {
  // docs/internal stayed at the repo root, so it must not be touched.
  const s = 'Spec: [s](../../docs/internal/release-plans/v2.16.0/spec.md)';
  assert.equal(rewriteInternalPaths(s), s);
  const w = 'Spec: [s](../docs/internal/release-plans/v2.16.0/spec.md)';
  assert.equal(rewriteWorkflowLinks(w), w);
});

test('unrelated links survive both rewrites untouched', () => {
  const s = 'See [sib](../other-skill/SKILL.md) and [ext](https://example.com/docs/x.md).';
  assert.equal(rewriteInternalPaths(s), s);
});
