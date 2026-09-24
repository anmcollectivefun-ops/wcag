import test from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio, contrastResult, luminance } from '../src/contrast.mjs';

test('identyczne kolory mają kontrast 1:1', () => {
  assert.equal(contrastRatio('#ffffff', '#ffffff'), 1);
  assert.equal(contrastRatio('#000000', '#000000'), 1);
});

test('czerń i biel mają kontrast 21:1', () => {
  assert.equal(contrastRatio('#000000', '#ffffff'), 21);
  assert.equal(contrastRatio('#ffffff', '#000000'), 21);
});

test('próg AAA dla zwykłego tekstu to 7:1, a dla dużego 4.5:1', () => {
  const normal = contrastResult('#595959', '#ffffff');
  assert.equal(normal.aaaNormalText, true);
  const largeOnly = contrastResult('#767676', '#ffffff');
  assert.equal(largeOnly.aaaNormalText, false);
  assert.equal(largeOnly.aaaLargeText, true);
});

test('niepoprawny zapis koloru jest odrzucany', () => {
  assert.throws(() => luminance('red'), TypeError);
  assert.throws(() => luminance('#abc'), TypeError);
});
