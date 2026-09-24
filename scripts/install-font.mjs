import { createRequire } from 'node:module';
import { cp, copyFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const cssPath = require.resolve('@fontsource-variable/atkinson-hyperlegible-next/wght.css');
const packageDir = path.dirname(cssPath);
const targetDir = path.resolve('assets/fonts');

await rm(targetDir, { recursive: true, force: true });
await mkdir(targetDir, { recursive: true });
await copyFile(cssPath, path.join(targetDir, 'atkinson.css'));
await cp(path.join(packageDir, 'files'), path.join(targetDir, 'files'), { recursive: true });

console.log('Atkinson Hyperlegible Next przygotowany lokalnie w assets/fonts.');
