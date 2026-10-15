import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { contrastRatio } from '../src/contrast.mjs';
import { publicPages } from '../scripts/public-pages.mjs';
const css = await readFile(new URL('../src/theme.css', import.meta.url), 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/--theme-(light|dark|reading)-([\w-]+):\s*(#[\da-f]{6})/gi)].map(m => [m[1] + '-' + m[2], m[3]]));
for (const theme of ['light', 'dark', 'reading']) {
  test(theme + ': tekst i akcenty osiągają AAA na każdej używanej powierzchni', () => {
    for (const foreground of ['text', 'text-2', 'muted', 'gold', 'danger']) {
      for (const background of ['bg', 'surface', 'surface-alt']) {
        const pair = [tokens[theme + '-' + foreground], tokens[theme + '-' + background]];
        assert.ok(contrastRatio(...pair) >= 7, `${theme} ${foreground}/${background}: ${contrastRatio(...pair)}`);
      }
    }
  });
  test(theme + ': przycisk i obramowania mają właściwy kontrast', () => {
    const onGold = theme === 'dark' ? tokens['dark-bg'] : '#FFFFFF';
    assert.ok(contrastRatio(onGold, tokens[theme + '-gold']) >= 7);
    for (const background of ['bg', 'surface', 'surface-alt']) assert.ok(contrastRatio(tokens[theme + '-border'], tokens[theme + '-' + background]) >= 3);
  });
}
test('wszystkie dokumenty HTML mają wspólne motywy, słownik i znaną strukturę', async () => {
  for (const page of await publicPages()) {
    const html = await readFile(page.file, 'utf8');
    assert.match(html, /\/src\/theme\.css/);
    assert.equal((html.match(/data-theme-choice=/g) || []).length, 3, page.path);
    assert.match(html, /href="\/slownik\.html"/);
    assert.equal((html.match(/<h1\b/g) || []).length, 1, page.path);
    assert.match(html, /<main id="main">/);
  }
});
test('kolory układu korzystają ze wspólnych tokenów', async () => {
  const layout = await readFile(new URL('../src/site.css', import.meta.url), 'utf8');
  assert.equal(layout.match(/#[0-9a-fA-F]{3,8}\b/g), null);
});
test('wysoki kontrast jest osobnym zapamiętywanym ustawieniem', async () => {
  const js = await readFile(new URL('../src/theme.mjs', import.meta.url), 'utf8');
  assert.match(js, /anm-access-high-contrast-v1/);
  assert.match(js, /data\.contrast|dataset\.contrast/);
  assert.match(js, /data-contrast-toggle/);
  assert.match(css, /data-contrast="high"/);
});
