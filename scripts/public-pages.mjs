import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
export async function publicPages(directory = root) {
  const entries = await readdir(directory, { withFileTypes: true });
  const pages = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.') || ['node_modules', 'audit-artifacts', 'coverage'].includes(entry.name)) continue;
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) pages.push(...await publicPages(filename));
    else if (entry.name.endsWith('.html')) {
      const relative = path.relative(root, filename).split(path.sep).join('/');
      pages.push({ path: relative === 'index.html' ? '/' : '/' + relative, file: filename, name: relative.replace(/\.html$/, '').replace(/[^a-z0-9-]/gi, '-') });
    }
  }
  return pages;
}
