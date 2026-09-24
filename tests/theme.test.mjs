import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { contrastResult } from '../src/contrast.mjs';

const palettes = {
  light: {
    bg:'#FFFFFF', surface:'#F7F7F5', surfaceAlt:'#EFEDEA',
    text:'#111111', text2:'#333333', muted:'#4A4A4A',
    gold:'#574000', border:'#6B6B6B', danger:'#8B1E1E', onGold:'#FFFFFF'
  },
  dark: {
    bg:'#0B0B0B', surface:'#161616', surfaceAlt:'#202020',
    text:'#F5F5F0', text2:'#D6D6D0', muted:'#D6D6D0',
    gold:'#D4AF37', border:'#8B8B86', danger:'#FF8A80', onGold:'#111111'
  },
  reading: {
    bg:'#F5EBD7', surface:'#F0E4CB', surfaceAlt:'#F5EBD7',
    text:'#2A241D', text2:'#4A4035', muted:'#4A4035',
    gold:'#574000', border:'#7A6A56', danger:'#8B1E1E', onGold:'#F5EBD7'
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

test('obie obecne strony używają wspólnego przełącznika trzech motywów', async () => {
  for (const file of ['../index.html','../laboratorium.html']) {
    const html = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(html, /\/src\/theme\.css/);
    assert.match(html, /\/src\/theme\.mjs/);
    assert.equal((html.match(/data-theme-choice=/g) || []).length, 3);
    assert.match(html, /data-theme-choice="light"/);
    assert.match(html, /data-theme-choice="dark"/);
    assert.match(html, /data-theme-choice="reading"/);
  }
});

test('stronicowe arkusze stylów nie zawierają własnych kolorów hex', async () => {
  for (const file of ['../src/styles.css','../src/lab.css']) {
    const css = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.equal(css.match(/#[0-9a-fA-F]{3,8}\b/g), null, file);
  }
});

test('motywy używają wyłącznie zatwierdzonego zestawu hex', async () => {
  const css = await readFile(new URL('../src/theme.css', import.meta.url), 'utf8');
  const actual = new Set((css.match(/#[0-9a-fA-F]{6}\b/g) || []).map(x => x.toUpperCase()));
  const approved = new Set(Object.values(palettes).flatMap(Object.values).map(x => x.toUpperCase()));
  for (const color of actual) assert.ok(approved.has(color), 'Niezaakceptowany kolor: ' + color);
});
