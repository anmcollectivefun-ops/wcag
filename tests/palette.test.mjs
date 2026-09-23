import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
function luminance(hex) {
  const rgb = hex.replace('#', '').match(/../g).map(value => parseInt(value, 16) / 255);
  const linear = rgb.map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}
function contrast(a, b) {
  const first = luminance(a), second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}
test('paleta tekstu i przycisku ma kontrast minimum 4.5:1 w podstawowych zestawieniach', () => {
  const samples = [
    ['#172339', '#ffffff'], ['#475467', '#ffffff'],
    ['#ffffff', '#174ca5'], ['#174ca5', '#e9f1ff'], ['#a51d2d', '#fff0f1']
  ];
  for (const pair of samples) assert.ok(contrast(...pair) >= 4.5, `${pair} < 4.5:1`);
});
test('obramowanie kontrolek ma kontrast minimum 3:1 na białym tle', () => {
  assert.ok(contrast('#7788a2', '#ffffff') >= 3);
  assert.match(css, /border: 2px solid #7788a2/);
});
