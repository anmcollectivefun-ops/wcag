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


test('każdy obraz na publicznych stronach ma jawny atrybut alt', async () => {
  for (const [file] of pages) {
    const html = await readFile(new URL(file, import.meta.url), 'utf8');
    const images = html.match(/<img\b[^>]*>/g) || [];
    for (const image of images) {
      assert.match(image, /\balt="[^"]*"/, file + ': ' + image);
    }
  }
});

test('zdjęcia użytkowników na stronie głównej mają opisowe alty', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /niewidomadziewczyna\.webp" alt="Uśmiechnięta kobieta w okularach trzyma białą laskę używaną przez osoby niewidome i słabowidzące\."/);
  assert.match(html, /niewidzacy\.webp" alt="Mężczyzna siedzi przy biurku i korzysta ze specjalistycznej klawiatury wspomagającej obsługę komputera przez osoby z dysfunkcją wzroku\."/);
});

test('każda publiczna strona ma wspólny górny pasek dostępności', async () => {
  for (const [file] of pages) {
    const html = await readFile(new URL(file, import.meta.url), 'utf8');
    assert.match(html, /class="accessibility-bar"/);
    assert.match(html, /data-contrast-toggle/);
    assert.match(html, /data-read-page/);
    assert.match(html, />PL<\/button>/);
    assert.match(html, />EN<\/button>/);
    assert.match(html, />UA<\/button>/);
  }
});

test('czytnik strony uwzględnia niepuste alty obrazów', async () => {
  const js = await readFile(new URL('../src/site.mjs', import.meta.url), 'utf8');
  assert.match(js, /img\[alt\]:not\(\[alt=""\]\)/);
  assert.match(js, /node\.getAttribute\('alt'\)/);
});


test('górny pasek ma kompaktową typografię i nie łamie etykiet po literach przy 200 procent', async () => {
  const css = await readFile(new URL('../src/site.css', import.meta.url), 'utf8');
  assert.match(css, /\.accessibility-bar :where\(\.access-group button,\.access-tool\)[\s\S]*?font-size:\.72rem/);
  assert.match(css, /\.accessibility-bar :where\(\.access-group button,\.access-tool\)[\s\S]*?font-weight:500/);
  assert.match(css, /white-space:nowrap/);
  assert.match(css, /html\[data-text-size="aaa"\] \.accessibility-bar-inner[\s\S]*?flex-wrap:wrap/);
});


test('nagłówek ma lekką typografię 16–18 px niezależną od presetów A AA AAA', async () => {
  const css = await readFile(new URL('../src/site.css', import.meta.url), 'utf8');
  assert.match(css, /\.accessibility-bar :where\(\.access-group button,\.access-tool\)[\s\S]*?font-size:16px[\s\S]*?font-weight:400/);
  assert.match(css, /\.navigation-row \.brand-copy strong[\s\S]*?font-size:18px[\s\S]*?font-weight:400/);
  assert.match(css, /\.navigation-row \.main-nav a[\s\S]*?font-size:17px[\s\S]*?font-weight:400/);
  assert.match(css, /html\[data-text-size="aaa"\][\s\S]*?font-size:16px/);
});


test('etykiety sekcji są lekkie i bez dekoracyjnych myślników', async () => {
  const css = await readFile(new URL('../src/site.css', import.meta.url), 'utf8');
  assert.match(css, /\.kicker\{[\s\S]*?font-size:\.72rem!important[\s\S]*?font-weight:500/);
  assert.match(css, /\.kicker::before\{[\s\S]*?content:none!important[\s\S]*?display:none!important/);
});
