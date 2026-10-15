import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { publicPages } from '../scripts/public-pages.mjs';
test('nazwy dostępne przycisków zawierają ich widoczne etykiety', async () => {
  for (const page of await publicPages()) {
    const html = await readFile(page.file, 'utf8');
    for (const match of html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)) {
      const label = /aria-label="([^"]+)"/.exec(match[1]);
      if (!label) continue;
      const visible = match[2].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      assert.ok(label[1].toLocaleLowerCase('pl').includes(visible.toLocaleLowerCase('pl')), `${page.path}: ${visible} / ${label[1]}`);
    }
  }
});
