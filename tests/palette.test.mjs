import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contrastResult } from '../src/contrast.mjs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');

test('podstawowe kontrolki korzystają ze wspólnych tokenów kolorystycznych', () => {
  assert.match(css, /border:\s*2px solid var\(--border\)/);
  assert.match(css, /color:\s*var\(--text\)/);
});

test('zatwierdzone złoto ma kontrast AAA z tekstem przycisków we wszystkich motywach', () => {
  const pairs = [
    ['#FFFFFF', '#574000'],
    ['#111111', '#D4AF37'],
    ['#F5EBD7', '#574000']
  ];
  for (const [text, background] of pairs) {
    assert.equal(contrastResult(text, background).aaaNormalText, true, text + ' / ' + background);
  }
});
