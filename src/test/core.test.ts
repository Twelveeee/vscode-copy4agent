import { test } from 'node:test';
import * as assert from 'node:assert/strict';
import { Sel, Snippet, TEMPLATE_IDS, mergeLineRanges, render, selectionToLineRange } from '../core';

const sel = (sl: number, sc: number, el: number, ec: number): Sel => ({
  start: { line: sl, character: sc },
  end: { line: el, character: ec },
});

test('empty selection uses the cursor line', () => {
  assert.deepEqual(selectionToLineRange(sel(4, 7, 4, 7)), { start: 4, end: 4 });
});

test('selection ending at column 0 of the next line drops that line', () => {
  // Gutter lines 10-30 drag-selected: end lands on line 31, column 0.
  assert.deepEqual(selectionToLineRange(sel(9, 0, 30, 0)), { start: 9, end: 29 });
});

test('selection ending mid-line keeps that line', () => {
  assert.deepEqual(selectionToLineRange(sel(9, 3, 29, 1)), { start: 9, end: 29 });
});

test('single-line selection ending at column 0 of the next line', () => {
  assert.deepEqual(selectionToLineRange(sel(9, 0, 10, 0)), { start: 9, end: 9 });
});

test('partial selection within one line', () => {
  assert.deepEqual(selectionToLineRange(sel(9, 2, 9, 8)), { start: 9, end: 9 });
});

test('merge sorts and joins overlapping/adjacent ranges', () => {
  assert.deepEqual(
    mergeLineRanges([
      { start: 20, end: 22 },
      { start: 1, end: 3 },
      { start: 4, end: 5 },
      { start: 21, end: 25 },
      { start: 10, end: 10 },
    ]),
    [
      { start: 1, end: 5 },
      { start: 10, end: 10 },
      { start: 20, end: 25 },
    ],
  );
});

const snip: Snippet = {
  path: 'test.py',
  range: { start: 9, end: 29 },
  code: 'a = 1\nb = 2',
  languageId: 'python',
};

test('templates render the expected shapes', () => {
  assert.equal(render('atPath', [snip]), '@test.py:10-30');
  assert.equal(render('atPathWithCode', [snip]), '@test.py:10-30\na = 1\nb = 2');
  assert.equal(render('atPathWithFencedCode', [snip]), '@test.py:10-30\n```python\na = 1\nb = 2\n```');
  assert.equal(render('atPathHashL', [snip]), '@test.py#L10-30');
  assert.equal(render('plainPath', [snip]), 'test.py:10-30');
});

test('single line has no range', () => {
  const one = { ...snip, range: { start: 4, end: 4 } };
  assert.equal(render('atPath', [one]), '@test.py:5');
  assert.equal(render('atPathHashL', [one]), '@test.py#L5');
});

test('fence grows past backticks in the code and maps language ids', () => {
  const md: Snippet = { ...snip, code: 'x ```` y', languageId: 'typescriptreact' };
  assert.equal(render('atPathWithFencedCode', [md]), '@test.py:10-30\n`````tsx\nx ```` y\n`````');
  const txt: Snippet = { ...snip, code: 'hi', languageId: 'plaintext' };
  assert.equal(render('atPathWithFencedCode', [txt]), '@test.py:10-30\n```\nhi\n```');
});

test('multiple snippets', () => {
  const other = { ...snip, range: { start: 39, end: 39 }, code: 'c = 3' };
  assert.equal(render('atPath', [snip, other]), '@test.py:10-30\n@test.py:40');
  assert.equal(render('atPathWithCode', [snip, other]), '@test.py:10-30\na = 1\nb = 2\n\n@test.py:40\nc = 3');
});

test('manifest enum matches TEMPLATE_IDS', () => {
  const pkg = require('../../package.json');
  const prop = pkg.contributes.configuration.properties['copy4agent.template'];
  assert.deepEqual(prop.enum, [...TEMPLATE_IDS]);
  assert.equal(prop.enumItemLabels.length, TEMPLATE_IDS.length);
  assert.equal(prop.markdownEnumDescriptions.length, TEMPLATE_IDS.length);
});

test('every template has a command in the submenu, hidden from the palette', () => {
  const pkg = require('../../package.json');
  const expected = TEMPLATE_IDS.map((id) => `copy4agent.copyAs.${id}`);
  const commands = pkg.contributes.commands.map((c: { command: string }) => c.command);
  const submenu = pkg.contributes.menus['copy4agent.copyWithTemplate'].map((m: { command: string }) => m.command);
  const hidden = pkg.contributes.menus.commandPalette
    .filter((m: { when: string }) => m.when === 'false')
    .map((m: { command: string }) => m.command);
  assert.deepEqual(submenu, expected);
  for (const id of ['copy4agent.copy', ...expected]) {
    assert.ok(commands.includes(id), id);
    assert.ok(hidden.includes(id), id);
  }
});

test('every manifest and runtime localization key is translated', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '..', '..');
  const read = (f: string) => JSON.parse(fs.readFileSync(path.join(root, f), 'utf8'));
  const nls = Object.keys(read('package.nls.json')).sort();
  const bundle = Object.keys(read('l10n/bundle.l10n.json')).sort();
  for (const locale of ['zh-cn', 'zh-tw']) {
    assert.deepEqual(Object.keys(read(`package.nls.${locale}.json`)).sort(), nls, locale);
    assert.deepEqual(Object.keys(read(`l10n/bundle.l10n.${locale}.json`)).sort(), bundle, locale);
  }
});
