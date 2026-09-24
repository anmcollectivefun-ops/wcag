import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('projekt używa Atkinson Hyperlegible Next jako lokalnej zależności', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(pkg.dependencies['@fontsource-variable/atkinson-hyperlegible-next'], '5.3.0');
  assert.match(pkg.scripts.postinstall, /install-font\.mjs/);
});

test('typografia ma ustaloną bazę 18 px oraz A, AA i AAA 100/150/200 procent', async () => {
  const css = await readFile(new URL('../src/typography.css', import.meta.url), 'utf8');
  assert.match(css, /font-size:18px/);
  assert.match(css, /data-text-size="a"\]\{font-size:18px\}/);
  assert.match(css, /data-text-size="aa"\]\{font-size:27px\}/);
  assert.match(css, /data-text-size="aaa"\]\{font-size:36px\}/);
  assert.match(css, /line-height:1\.6/);
  assert.match(css, /max-width:75ch/);
  assert.match(css, /Atkinson Hyperlegible Next Variable/);
});

test('każda publiczna strona ma globalny komplet A AA AAA i wspólną typografię', async () => {
  for (const file of ["../index.html","../audyt.html","../o-nas.html","../kontakt.html","../aktualnosci.html"]) {
    const html = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(html, /data-text-size="a"/);
    assert.match(html, /\/assets\/fonts\/atkinson\.css/);
    assert.match(html, /\/src\/typography\.css/);
    assert.equal((html.match(/data-text-size-choice=/g) || []).length, 3);
    assert.match(html, />A<\/button>/);
    assert.match(html, />AA<\/button>/);
    assert.match(html, />AAA<\/button>/);
  }
});

test('ustawienie wielkości tekstu jest wspólne i zapamiętywane', async () => {
  const js = await readFile(new URL('../src/theme.mjs', import.meta.url), 'utf8');
  assert.match(js, /anm-access-text-size-v1/);
  assert.match(js, /TEXT_SIZES = new Set\(\['a','aa','aaa'\]\)/);
  assert.match(js, /localStorage\.setItem\(TEXT_KEY/);
  assert.match(js, /textSizeChoice/);
});

test('serwer obsługuje fonty woff i woff2 z własnej domeny', async () => {
  const server = await readFile(new URL('../server.mjs', import.meta.url), 'utf8');
  assert.match(server, /font\/woff2/);
  assert.match(server, /font\/woff/);
});

test('nagłówki mają spokojniejszą skalę i wagę 500', async () => {
  const css = await readFile(new URL('../src/typography.css', import.meta.url), 'utf8');
  assert.match(css, /h1\{font-size:1\.6667rem;font-weight:500\}/);
  assert.match(css, /h2\{font-size:1\.4444rem;font-weight:500\}/);
  assert.match(css, /h3\{font-size:1\.2222rem;font-weight:500\}/);
  assert.match(css, /h4\{font-size:1\.1111rem;font-weight:500\}/);
});
