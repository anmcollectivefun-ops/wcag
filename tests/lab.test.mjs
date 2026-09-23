import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { contrastRatio, contrastResult, luminance } from '../src/contrast.mjs';

test('identyczne kolory mają kontrast 1:1', () => {
  assert.equal(contrastRatio('#ffffff', '#ffffff'), 1);
  assert.equal(contrastRatio('#000000', '#000000'), 1);
});
test('kontrast jest symetryczny i prawidłowy dla czerni i bieli', () => {
  assert.equal(contrastRatio('#000000', '#ffffff'), 21);
  assert.equal(contrastRatio('#ffffff', '#000000'), 21);
});
test('wybrane palety przechodzą próg 7:1 dla zwykłego tekstu AAA', () => {
  for (const [foreground, background] of [
    ['#101828', '#ffffff'], ['#ffffff', '#111827'], ['#1b2430', '#fff9e8']
  ]) {
    const result = contrastResult(foreground, background);
    assert.equal(result.aaaNormalText, true, foreground + ' / ' + background);
  }
});
test('słaby kontrast nie zostaje błędnie oznaczony jako AAA', () => {
  const result = contrastResult('#b2bac6', '#ffffff');
  assert.equal(result.aaaNormalText, false);
  assert.equal(result.aaaLargeText, false);
});
test('próg dla dużego tekstu jest inny niż dla zwykłego', () => {
  const result = contrastResult('#767676', '#ffffff');
  assert.equal(result.aaaNormalText, false);
  assert.equal(result.aaaLargeText, true);
});
test('niepoprawny zapis koloru kończy się kontrolowanym błędem', () => {
  assert.throws(() => luminance('red'), TypeError);
  assert.throws(() => luminance('#abc'), TypeError);
});
test('laboratorium ma opisy formularzy, rzeczywistą sekcję main i uczciwą informację o audycie', async () => {
  const html = await readFile(new URL('../laboratorium.html', import.meta.url), 'utf8');
  assert.match(html, /<main id="main"/);
  assert.match(html, /<label for="company">/);
  assert.match(html, /<label for="foreground">/);
  assert.match(html, /<label for="background">/);
  assert.match(html, /name="text-size" value="200"/);
  assert.match(html, /Sam przełącznik „AAA” niczego nie potwierdza/);
});
test('dane wpisywane przez odwiedzającego trafiają do próbki jako tekst, bez HTML', async () => {
  const source = await readFile(new URL('../src/lab.mjs', import.meta.url), 'utf8');
  assert.match(source, /node\.textContent = value/);
  assert.doesNotMatch(source, /\.innerHTML\s*=/);
});
