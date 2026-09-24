import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { contrastResult } from '../src/contrast.mjs';

const palettes = {
  light: {
    bg:'#FCFDFD', surface:'#FFFFFF', surfaceAlt:'#EDF5F6',
    text:'#102126', text2:'#263B42', muted:'#40565E',
    gold:'#174C6B', border:'#657880', danger:'#8B1E1E', onGold:'#FFFFFF'
  },
  dark: {
    bg:'#0A1114', surface:'#101A1E', surfaceAlt:'#162329',
    text:'#F6FAFB', text2:'#D8E4E7', muted:'#C4D1D5',
    gold:'#A9DDF5', border:'#82959C', danger:'#FF9E96', onGold:'#111111'
  },
  reading: {
    bg:'#F5EBD7', surface:'#F0E4CB', surfaceAlt:'#F5EBD7',
    text:'#2A241D', text2:'#4A4035', muted:'#4A4035',
    gold:'#174C6B', border:'#7A6A56', danger:'#8B1E1E', onGold:'#FFFFFF'
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
