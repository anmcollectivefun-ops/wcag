import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { contrastResult } from '../src/contrast.mjs';

const palettes = {
  light: {
    bg:'#FBF8F1', surface:'#FFFDFC', surfaceAlt:'#F4EDE2',
    text:'#1F1A14', text2:'#3B3329', muted:'#514638',
    gold:'#5A2430', border:'#8A7657', danger:'#8B1E1E', onGold:'#FFFFFF'
  },
  dark: {
    bg:'#281014', surface:'#35151A', surfaceAlt:'#431921',
    text:'#FDF2F4', text2:'#E6C8CF', muted:'#CBA1AB',
    gold:'#DCA373', border:'#AD6376', danger:'#FFB0A8', onGold:'#281014'
  },
  reading: {
    bg:'#F3E7CF', surface:'#FAF2E3', surfaceAlt:'#E9D9BC',
    text:'#2A2117', text2:'#413426', muted:'#544431',
    gold:'#5A2430', border:'#7D6849', danger:'#8B1E1E', onGold:'#FFFFFF'
  }
};

for (const [name, palette] of Object.entries(palettes)) {
  test(name + ': główny tekst, tekst pomocniczy i złoto osiągają 7:1 na tle strony', () => {
    for (const key of ['text','text2','muted','gold','danger']) {
      assert.equal(
        contrastResult(palette[key], palette.bg).aaaNormalText,
        true,
        name + ' / ' + key + ' / ' + palette[key] + ' on ' + palette.bg
      );
    }
  });
  test(name + ': tekst na złotym przycisku osiąga 7:1', () => {
    assert.equal(contrastResult(palette.onGold, palette.gold).aaaNormalText, true);
  });
  test(name + ': obramowania kontrolek mają co najmniej 3:1 względem powierzchni', () => {
    assert.ok(contrastResult(palette.border, palette.surface).ratio >= 3);
  });
}

test('wszystkie publiczne strony używają wspólnego przełącznika trzech motywów', async () => {
  for (const file of ["../index.html","../audyt.html","../szkolenia.html","../baza-wiedzy.html","../o-nas.html","../kontakt.html"]) {
    const html = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(html, /\/src\/theme\.css/);
    assert.match(html, /\/src\/theme\.mjs/);
    assert.equal((html.match(/data-theme-choice=/g) || []).length, 3);
    assert.match(html, /data-theme-choice="light"/);
    assert.match(html, /data-theme-choice="dark"/);
    assert.match(html, /data-theme-choice="reading"/);
  }
});

test('wspólny arkusz stron nie zawiera własnych kolorów hex', async () => {
  const css = await readFile(new URL('../src/site.css', import.meta.url), 'utf8');
  assert.equal(css.match(/#[0-9a-fA-F]{3,8}\b/g), null);
});

test('motywy używają wyłącznie zatwierdzonego zestawu hex', async () => {
  const css = await readFile(new URL('../src/theme.css', import.meta.url), 'utf8');
  const actual = new Set((css.match(/#[0-9a-fA-F]{6}\b/g) || []).map(x => x.toUpperCase()));
  const approved = new Set(Object.values(palettes).flatMap(Object.values).map(x => x.toUpperCase()));
  for (const color of actual) assert.ok(approved.has(color), 'Niezaakceptowany kolor: ' + color);
});


test('wysoki kontrast jest osobnym zapamiętywanym ustawieniem', async () => {
  const js = await readFile(new URL('../src/theme.mjs', import.meta.url), 'utf8');
  const css = await readFile(new URL('../src/theme.css', import.meta.url), 'utf8');
  assert.match(js, /anm-access-high-contrast-v1/);
  assert.match(js, /data\.contrast|dataset\.contrast/);
  assert.match(js, /data-contrast-toggle/);
  assert.match(css, /data-contrast="high"/);
});
