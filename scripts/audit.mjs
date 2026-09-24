import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const base = 'http://127.0.0.1:4173';
const output = 'audit-artifacts';
const pages = [["/","home"],["/audyt.html","audit"],["/szkolenia.html","training"],["/baza-wiedzy.html","knowledge"],["/o-nas.html","about"],["/kontakt.html","contact"]];
const server = spawn(process.execPath, ['server.mjs'], {
  env: { ...process.env, HOST: '127.0.0.1', PORT: '4173' },
  stdio: ['ignore', 'pipe', 'pipe']
});
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

const summariseViolation = violation => ({
  id: violation.id,
  impact: violation.impact,
  description: violation.help,
  wcag: violation.tags.filter(tag => /^wcag/.test(tag)),
  nodes: violation.nodes.map(node => ({ target: node.target, summary: node.failureSummary }))
});

async function inspect(page, path, name, width) {
  const response = await page.goto(base + path, { waitUntil: 'networkidle' });
  const scanned = await new AxeBuilder({ page }).withTags([
    'wcag2a','wcag2aa','wcag2aaa','wcag21a','wcag21aa','wcag22a','wcag22aa','wcag22aaa','best-practice'
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

async function inspectAAAReflow(page, path, name) {
  await page.setViewportSize({ width: 320, height: 860 });
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.locator('[data-text-size-choice="aaa"]').click();
  return page.evaluate(({ path, name }) => ({
    path,
    name,
    rootFontSize: getComputedStyle(document.documentElement).fontSize,
    activeSize: document.documentElement.dataset.textSize,
    innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    overflow: document.documentElement.scrollWidth > innerWidth + 1
  }), { path, name });
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
    for (const [path, name] of pages) results.push(await inspect(page, path, name, width));
  }

  const aaaReflow = [];
  for (const [path, name] of pages) aaaReflow.push(await inspectAAAReflow(page, path, name));

  const violations = results.flatMap(result => result.axe.violations.map(v => ({ path: result.path, width: result.width, ...v })));
  const incomplete = results.flatMap(result => result.axe.incomplete.map(v => ({ path: result.path, width: result.width, ...v })));
  const overflowFailures = results.filter(result => result.hasHorizontalOverflow);
  const aaaOverflowFailures = aaaReflow.filter(result => result.overflow);

  const outcome = {
    timestamp: new Date().toISOString(),
    scope: 'Sześć publicznych stron ANM Access przy 1280 i 320 CSS px oraz globalny tryb AAA/200% przy 320 CSS px.',
    environment: 'Playwright / Chromium headless + axe-core. Wyniki automatyczne nie zastępują testów manualnych.',
    results,
    aaaReflow,
    violations,
    incomplete,
    automatedGreen: violations.length === 0 && overflowFailures.length === 0 && aaaOverflowFailures.length === 0
  };
  await writeFile(output + '/report.json', JSON.stringify(outcome, null, 2));

  const lines = [
    '# Audyt automatyczny publicznych stron ANM Access',
    '',
    'Data (UTC): ' + outcome.timestamp,
    '',
    '## Zakres',
    outcome.scope,
    outcome.environment,
    ''
  ];
  for (const result of results) {
    lines.push(
      '### ' + result.path + ' — ' + result.width + ' CSS px',
      '- HTTP: ' + result.httpStatus,
      '- Overflow całej strony: ' + (result.hasHorizontalOverflow ? 'TAK' : 'nie'),
      '- Naruszenia axe: ' + result.axe.violations.length,
      '- Elementy wymagające oceny człowieka: ' + result.axe.incomplete.length,
      ''
    );
  }
  lines.push('## Reflow AAA / 200%', ...aaaReflow.map(r => '- ' + r.path + ': ' + (r.overflow ? 'FAIL' : 'OK') + ' (' + r.scrollWidth + '/' + r.innerWidth + ' px)'), '');
  lines.push('## Wynik automatyczny', outcome.automatedGreen ? 'ZIELONY' : 'WYMAGA POPRAWY', '');
  lines.push('Pełna zgodność WCAG 2.2 AAA wymaga również testów manualnych i oceny wszystkich właściwych kryteriów.');
  await writeFile(output + '/report.md', lines.join('\n'));

  console.log(JSON.stringify({
    audited: results.map(r => ({ path: r.path, width: r.width, violations: r.axe.violations.map(v => v.id), incomplete: r.axe.incomplete.length, overflow: r.hasHorizontalOverflow })),
    aaaReflow,
    violationCount: violations.length,
    incompleteCount: incomplete.length,
    automatedGreen: outcome.automatedGreen,
    report: output + '/report.md'
  }));

  if (!outcome.automatedGreen) process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
