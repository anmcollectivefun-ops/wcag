import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = 'http://127.0.0.1:4173';
const output = 'audit-artifacts';
const server = spawn(process.execPath, ['server.mjs'], { env: { ...process.env, HOST: '127.0.0.1', PORT: '4173' }, stdio: ['ignore', 'pipe', 'pipe'] });
let serverOutput = '';
server.stdout.on('data', chunk => { serverOutput += chunk.toString(); });
server.stderr.on('data', chunk => { serverOutput += chunk.toString(); });

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error('Serwer nie wystartował. ' + serverOutput);
}
const summariseViolation = v => ({
  id: v.id, impact: v.impact, description: v.help, wcag: v.tags.filter(tag => /^wcag/.test(tag)),
  nodes: v.nodes.map(node => ({ target: node.target, summary: node.failureSummary }))
});
async function inspect(page, path, name, width) {
  const response = await page.goto(base + path, { waitUntil: 'networkidle' });
  const scanned = await new AxeBuilder({ page }).withTags([
    'wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa', 'wcag22aaa', 'best-practice'
  ]).analyze();
  const viewport = await page.evaluate(() => ({
    viewport: innerWidth,
    pageScrollWidth: document.documentElement.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1,
    title: document.title
  }));
  await page.screenshot({ path: output + '/' + name + '-' + width + '.png', fullPage: true });
  return {
    path, width, httpStatus: response.status(), ...viewport,
    axe: {
      violations: scanned.violations.map(summariseViolation),
      incomplete: scanned.incomplete.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })),
      passes: scanned.passes.length
    }
  };
}
await mkdir(output, { recursive: true });
let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ bypassCSP: true });
  const page = await context.newPage();
  const results = [];
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 860 });
    for (const [path, name] of [['/', 'home'], ['/laboratorium.html', 'lab']]) {
      results.push(await inspect(page, path, name, width));
    }
  }
  await page.setViewportSize({ width: 320, height: 860 });
  await page.goto(base + '/laboratorium.html');
  await page.getByLabel('200%', { exact: true }).check();
  const zoom200 = await page.evaluate(() => {
    const el = document.querySelector('#preview-after');
    return {
      scale: el.style.getPropertyValue('--demo-scale'),
      bodyOverflow: document.documentElement.scrollWidth > innerWidth + 1,
      previewOverflow: el.scrollWidth > el.clientWidth + 1
    };
  });
  await page.getByLabel('Kolor tekstu').evaluate(node => { node.value = '#777777'; node.dispatchEvent(new Event('input', { bubbles: true })); });
  const warnsInvalidColours = /Za niski/.test(await page.locator('#contrast-status').innerText());
  const button = page.locator('#preview-action');
  await button.focus();
  await page.keyboard.press('Enter');
  const buttonKeyboardResult = /Przycisk w poprawionej próbce działa również z klawiatury/.test(await page.locator('#interaction-message').innerText());
  const pageTextScale = [];
  for (const [path, name] of [['/', 'home'], ['/laboratorium.html', 'lab']]) {
    await page.setViewportSize({ width: 320, height: 860 });
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.locator('[data-text-size-choice="aaa"]').click();
    const scaleResult = await page.evaluate(() => {
      const overflowing = [...document.querySelectorAll('body *')].flatMap(element => {
        const rect = element.getBoundingClientRect();
        if (rect.right <= innerWidth + 1 && rect.left >= -1) return [];
        return [{
          tag: element.tagName.toLowerCase(),
          id: element.id || null,
          className: typeof element.className === 'string' ? element.className : null,
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          text: (element.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120)
        }];
      }).slice(0, 20);
      return {
        rootFontSize: getComputedStyle(document.documentElement).fontSize,
        innerWidth,
        rootScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        bodyOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        activeSize: document.documentElement.dataset.textSize,
        overflowing
      };
    });
    pageTextScale.push({ path, name, ...scaleResult });
  }
  const interactions = { zoom200, warnsInvalidColours, buttonKeyboardResult, pageTextScale };
  const violations = results.flatMap(page => page.axe.violations.map(v => ({
    path: page.path, width: page.width, ...v
  })));
  const incomplete = results.flatMap(page => page.axe.incomplete.map(v => ({
    path: page.path, width: page.width, ...v
  })));
  const outcome = {
    timestamp: new Date().toISOString(),
    scope: 'ANM Access: strona główna i laboratorium, 1280 i 320 CSS px; interakcje wybranych kontrolek.',
    environment: 'Playwright / Chromium headless; axe-core; testy automatyczne. Testy manualne NVDA/VoiceOver i osoby słabowidzące poza zakresem.',
    results, interactions, violations, incomplete,
    auditedAAA: false,
    reason: 'Testy automatyczne nie potwierdzają pełnej zgodności WCAG 2.2 AAA. Ponadto pokaz przed poprawek zawiera zamierzone bariery kontrastu.'
  };
  await writeFile(output + '/report.json', JSON.stringify(outcome, null, 2));
  const lines = [
    '# Audyt techniczny ANM Access — wyniki automatyczne',
    '', '**Uwaga:** To nie jest certyfikat zgodności WCAG 2.2 AAA. Testy manualne nie zostały wykonane.',
    '', 'Data (UTC): ' + outcome.timestamp, '', '## Zakres', outcome.scope, outcome.environment,
    '', '## Wyniki stron'
  ];
  for (const result of results) {
    lines.push('', '### ' + result.path + ' — ' + result.width + ' CSS px',
      '- HTTP: ' + result.httpStatus,
      '- Poziomy overflow: ' + (result.hasHorizontalOverflow ? 'TAK (do sprawdzenia)' : 'nie wykryto'),
      '- Automatyczne naruszenia axe: ' + result.axe.violations.length,
      '- Przypadki wymagające oceny człowieka: ' + result.axe.incomplete.length);
    for (const v of result.axe.violations) lines.push('  - **' + v.impact + ' / ' + v.id + '** — ' + v.description + ' — ' + v.nodes.map(n => n.target.join(' ')).join(', '));
  }
  lines.push('', '## Testy interakcji', '- Powiększenie 200%: ' + JSON.stringify(zoom200),
    '- Ostrzeżenie o niskim kontraście: ' + warnsInvalidColours,
    '- Aktywacja przycisku klawiaturą: ' + buttonKeyboardResult,
    '- Globalny rozmiar AAA / 200%: ' + JSON.stringify(pageTextScale),
    '', '## Zakres niezweryfikowany', '- Ręczne testy czytników ekranu i nawigacji w całym procesie.',
    '- Obiektywny audyt wszystkich właściwych kryteriów A/AA/AAA.',
    '- Testy z osobami słabowidzącymi.', '',
    '## Wniosek', 'Brak podstaw do deklarowania pełnej zgodności WCAG 2.2 AAA. Wyniki automatyczne są częściową oceną techniczną.', '');
  await writeFile(output + '/report.md', lines.join('\n'));
  console.log(JSON.stringify({
    audited: results.map(r => ({ path: r.path, width: r.width, violations: r.axe.violations.map(v => v.id), incomplete: r.axe.incomplete.length, overflow: r.hasHorizontalOverflow })),
    interactions, violationCount: violations.length, incompleteCount: incomplete.length,
    report: output + '/report.md'
  }));
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
