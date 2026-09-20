import { mkdirSync, rmSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import * as esbuild from 'esbuild';

const root = join(new URL('.', import.meta.url).pathname, '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

const distDir = join(root, 'dist');
const typesDir = join(distDir, 'types');

rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });
mkdirSync(typesDir, { recursive: true });

await esbuild.build({
  entryPoints: [join(root, 'index.js')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: join(distDir, 'index.js'),
  external: ['zod'],
  sourcemap: true,
  target: 'node22',
  minifyIdentifiers: false,
  minifySyntax: false,
  keepNames: true,
  banner: {
    js: 'import { createRequire } from "module";',
  },
});

try {
  execFileSync('npx', ['tsc', '-p', join(root, 'tsconfig.build.json')], { cwd: root, stdio: 'inherit' });
} catch {}
// Copy handwritten types as canonical (types/index.d.ts is source of truth)
copyFileSync(join(root, 'types/index.d.ts'), join(typesDir, 'index.d.ts'));

const distPkg = { ...pkg };
delete distPkg.scripts;
delete distPkg.devDependencies;
delete distPkg.publishConfig;
distPkg.main = 'index.js';
distPkg.types = 'types/index.d.ts';
distPkg.files = ['index.js', 'types', 'LICENSE', 'README.md'];

writeFileSync(join(distDir, 'package.json'), `${JSON.stringify(distPkg, null, 2)}\n`);

copyFileSync(join(root, 'LICENSE'), join(distDir, 'LICENSE'));
copyFileSync(join(root, 'README.md'), join(distDir, 'README.md'));

console.log(`SDK built: ${pkg.name}@${pkg.version}`);
console.log(`Output: ${distDir}`);