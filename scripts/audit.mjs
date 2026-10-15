import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { publicPages } from './public-pages.mjs';
import { inspectPanelFocus } from './check-focus.mjs';

const base = 'http://127.0.0.1:4173';
const output = process.env.AUDIT_OUTPUT_DIR || 'audit-artifacts';
const allPages = await publicPages();
const selection = process.env.AUDIT_PATHS ? JSON.parse(process.env.AUDIT_PATHS) : null;
const pages = selection ? allPages.filter(page => selection.includes(page.path)) : allPages;
if (!pages.length || (selection && pages.length !== selection.length)) throw new Error('Nieznana strona w AUDIT_PATHS');
const server = spawn(process.execPath, ['server.mjs'], {
  env: { ...process.env, HOST: '127.0.0.1', PORT: '4173' }, stdio: ['ignore', 'pipe', 'pipe']
});
let serverOutput = '';
server.stdout.on('data', chunk => { serverOutput += chunk; });
server.stderr.on('data', chunk => { serverOutput += chunk; });
async function ready() {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(base)).ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error('Serwer nie wystartował. ' + serverOutput);
}
const summarise = v => ({
  id: v.id, impact: v.impact, description: v.help, tags: v.tags,
  nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary, html: n.html }))
});
async function layout(page) {
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    // Test expandable content while visible; closed details retain layout rectangles in Chromium.
    const closedDetails = [...document.querySelectorAll('main details:not([open])')];
    closedDetails.forEach(el => { el.open = true; });
    const clippedText = [];
    for (const el of document.querySelectorAll('main p,main h1,main h2,main h3,main li,main a,main dd,main dt,main summary,button')) {
      if (!el.getClientRects().length) continue;
      const range = document.createRange(); range.selectNodeContents(el);
      const rects = [...range.getClientRects()];
      for (let parent = el; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent), bounds = parent.getBoundingClientRect();
        if (['hidden', 'clip'].includes(style.overflowX) && rects.some(r => r.left < bounds.left - 2 || r.right > bounds.right + 2)) {
          clippedText.push({ direction: 'horizontal', text: el.textContent.trim().slice(0, 100), parent: parent.className }); break;
        }
        const box = el.getBoundingClientRect();
        if (['hidden', 'clip'].includes(style.overflowY) && (rects.some(r => r.top < bounds.top - 2 || r.bottom > bounds.bottom + 2) || (el.matches('a,button,summary') && (box.top < bounds.top - 2 || box.bottom > bounds.bottom + 2)))) {
          clippedText.push({ direction: 'vertical', text: el.textContent.trim().slice(0, 100), parent: parent.className }); break;
        }
      }
    }
    const result = { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, clippedText };
    closedDetails.forEach(el => { el.open = false; });
    return result;
  });
}
async function load(page, route) {
  const response = await page.goto(base + encodeURI(route), { waitUntil: 'networkidle' });
  await page.locator('[data-text-size-choice="a"]').click();
  if (await page.locator('[data-contrast-toggle]').getAttribute('aria-pressed') === 'true') await page.locator('[data-contrast-toggle]').click();
  return response.status();
}
await mkdir(output, { recursive: true });
let browser;
try {
  await ready();
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH, args: ['--no-sandbox','--disable-gpu','--single-process','--no-zygote'] } : {})
  });
  // CSP is bypassed only in the local test context, for axe and the simulated user text stylesheet.
  const context = await browser.newContext({ bypassCSP: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const results = [], adjustments = [], failures = [];
  for (const width of [1280, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (const item of pages) {
      const status = await load(page, item.path);
      for (const theme of ['light', 'dark', 'reading']) {
        await page.locator(`[data-theme-choice="${theme}"]`).click();
        await page.waitForTimeout(300);
        const scan = await new AxeBuilder({ page }).withTags([
          'wcag2a','wcag2aa','wcag2aaa','wcag21a','wcag21aa','wcag21aaa','wcag22aa','wcag22aaa','best-practice'
        ]).analyze();
        const geometry = await layout(page);
        const focus = await inspectPanelFocus(page);
        const result = { path: item.path, width, theme, status, ...geometry, focus, violations: scan.violations.map(summarise), incomplete: scan.incomplete.map(summarise) };
        results.push(result);
        if (status !== 200 || result.violations.length || focus.some(item => !item.pass) || geometry.scrollWidth > width + 1 || geometry.clippedText.length) failures.push(result);
      }
      console.log(width, item.path, 'scans', results.length, 'failures', failures.length);
      await writeFile(output + '/report.json', JSON.stringify({ results, adjustments, failures }, null, 2));
    }
  }
  await page.setViewportSize({ width: 320, height: 900 });
  for (const item of pages) {
    await load(page, item.path);
    await page.locator('[data-theme-choice="light"]').click();
    await page.locator('[data-text-size-choice="aaa"]').click();
    const enlarged = await layout(page);
    await page.locator('[data-text-size-choice="a"]').click();
    await page.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}' });
    const spacing = await layout(page);
    const itemResult = { path: item.path, enlarged, spacing };
    adjustments.push(itemResult);
    for (const [mode, geometry] of Object.entries({ enlarged, spacing })) if (geometry.scrollWidth > 321 || geometry.clippedText.length) failures.push({ path: item.path, mode, ...geometry });
  }
  await load(page, '/');
  await page.locator('[data-nav-toggle]').press('Enter');
  const opened = await page.locator('[data-nav-toggle]').getAttribute('aria-expanded') === 'true';
  await page.keyboard.press('Escape');
  const closed = await page.locator('[data-nav-toggle]').getAttribute('aria-expanded') === 'false';
  if (!opened || !closed) failures.push({ path: '/', check: 'keyboard-menu', opened, closed });
  const outcome = { timestamp: new Date().toISOString(), pageCount: pages.length, results, adjustments, failures,
    scope: 'Wszystkie pliki HTML, trzy motywy, 1280/320 CSS px, reguły automatyczne A/AA/AAA, dodatkowe powiększenie treści i odstępy tekstu.',
    limitation: 'Wynik automatyczny nie potwierdza pełnej zgodności. Czytniki ekranu, rzeczywisty zoom przeglądarki i ocena języka wymagają dalszych testów.',
    automatedGreen: failures.length === 0 };
  await writeFile(output + '/report.json', JSON.stringify(outcome, null, 2));
  await writeFile(output + '/report.md', '# ANM Access — wynik testów automatycznych\n\n' + outcome.scope + '\n\nStrony: ' + pages.length + '. Skany: ' + results.length + '. Wykryte problemy: ' + failures.length + '.\n\n' + outcome.limitation + '\n');
  console.log(JSON.stringify({ pages: pages.length, scans: results.length, adjustments: adjustments.length, failures: failures.length, automatedGreen: outcome.automatedGreen }));
  if (failures.length) process.exitCode = 1;
} finally { await browser?.close(); server.kill('SIGTERM'); }
