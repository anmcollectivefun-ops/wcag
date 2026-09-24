import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pages = [
  ['../index.html','Strona główna'],
  ['../audyt.html','Audyt WCAG'],
  ['../szkolenia.html','Szkolenia'],
  ['../baza-wiedzy.html','Baza wiedzy'],
  ['../o-nas.html','O nas'],
  ['../kontakt.html','Kontakt']
];

test('każda publiczna strona ma skip link, main i dokładnie jedno H1', async () => {
  for (const [file] of pages) {
    const html = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(html, /class="skip-link" href="#main"/);
    assert.match(html, /<main id="main">/);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, file);
  }
});

test('każda publiczna strona ma pełne menu sześciu stron i aktywną pozycję', async () => {
  const expected = ['Strona główna','Audyt WCAG','Szkolenia','Baza wiedzy','O nas','Kontakt'];
  for (const [file, active] of pages) {
    const html = await readFile(new URL(file, import.meta.url), 'utf8');
    for (const label of expected) assert.ok(html.includes('>' + label + '</a>'), file + ': ' + label);
    assert.equal((html.match(/aria-current="page"/g) || []).length, 1, file);
    assert.ok(html.includes('aria-current="page">' + active + '</a>'), file + ': aktywna pozycja');
  }
});

test('publiczne strony nie zawierają oznaczeń demo ani starego laboratorium', async () => {
  for (const [file] of pages) {
    const html = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.doesNotMatch(html, /\bdemo\b/i, file);
    assert.doesNotMatch(html, /demonstracyj/i, file);
    assert.doesNotMatch(html, /laboratorium\.html/i, file);
  }
});

test('każda publiczna strona korzysta z jednego arkusza układu', async () => {
  for (const [file] of pages) {
    const html = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(html, /\/src\/site\.css/);
  }
});
