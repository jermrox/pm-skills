import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildCatalog, renderBody, wrapDocument } from './build-console.mjs';
import { REPO_ROOT } from './lib/catalog.mjs';

test('buildCatalog snapshots the live repo catalog', () => {
  const d = buildCatalog();
  assert.equal(d.skills.length, d.catalog.skills);
  assert.ok(d.agents.length >= 6);
  assert.ok(d.workflows.length >= 10);
  assert.ok(d.skills.some((s) => s.phase === 'deliver'));
});

test('renderBody injects parseable JSON and escapes closing script tags', () => {
  const data = { catalog: { skills: 1 }, skills: [{ name: 'x', description: 'a </script> b' }], agents: [], workflows: [] };
  const body = renderBody('const DATA = /*__CATALOG__*/;', data);
  assert.ok(!body.includes('</script>'), 'raw </script> would close the block early');
  // The escaped form is still valid JSON once the JS string literal is read back.
  const json = body.slice('const DATA = '.length, -1).replace(/<\\\//g, '</');
  assert.equal(JSON.parse(json).skills[0].description, 'a </script> b');
});

test('renderBody refuses a template without the placeholder', () => {
  assert.throws(() => renderBody('no placeholder here', {}), /placeholder/);
});

test('wrapDocument produces a standalone document', () => {
  const doc = wrapDocument('<title>T</title>\n<div>hi</div>');
  assert.ok(doc.startsWith('<!DOCTYPE html>'));
  assert.ok(doc.includes('<meta charset="utf-8">'));
  assert.ok(doc.trimEnd().endsWith('</html>'));
});

test('built console files are current with the catalog', () => {
  const template = fs.readFileSync(path.join(REPO_ROOT, 'dashboard', 'template', 'console.body.html'), 'utf8');
  const expected = renderBody(template, buildCatalog());
  const built = fs.readFileSync(path.join(REPO_ROOT, 'dashboard', 'public', 'console.body.html'), 'utf8');
  assert.equal(built, expected, 'console.body.html is stale: run node dashboard/build-console.mjs');
  const doc = fs.readFileSync(path.join(REPO_ROOT, 'dashboard', 'public', 'console.html'), 'utf8');
  assert.equal(doc, wrapDocument(expected), 'console.html is stale: run node dashboard/build-console.mjs');
});

test('the artifact body carries no document-level tags', () => {
  const body = fs.readFileSync(path.join(REPO_ROOT, 'dashboard', 'public', 'console.body.html'), 'utf8');
  for (const tag of ['<!DOCTYPE', '<html', '<head>', '<body']) {
    assert.ok(!body.includes(tag), `artifact body must not contain ${tag}`);
  }
  assert.ok(body.includes('<title>PM Skills Console</title>'));
});

test('every color token is defined on bare :root, not only behind a media query', () => {
  const body = fs.readFileSync(path.join(REPO_ROOT, 'dashboard', 'public', 'console.body.html'), 'utf8');
  const bare = /:root\s*\{([\s\S]*?)\}/.exec(body);
  assert.ok(bare, 'expected a bare :root block');
  const bareTokens = new Set([...bare[1].matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
  const themed = [...body.matchAll(/:root(?::not\(\[data-theme="light"\]\)|\[data-theme="dark"\])\s*\{([\s\S]*?)\}/g)];
  assert.ok(themed.length >= 2, 'expected both a prefers-color-scheme and a [data-theme="dark"] block');
  for (const block of themed) {
    for (const [, token] of block[1].matchAll(/(--[\w-]+)\s*:/g)) {
      assert.ok(bareTokens.has(token), `${token} is redefined for dark but never defined on bare :root`);
    }
  }
});
