import esbuild from 'esbuild'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const watch = process.argv.includes('--watch')
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const ctx = await esbuild.context({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  external: ['vscode', '@digicoda/data'],
  sourcemap: true,
  minify: false,
  logLevel: 'info',
  banner: {
    js: `const require = require('module').createRequire(__filename);`,
  },
})

if (watch) {
  await ctx.watch()
} else {
  await ctx.rebuild()
  await ctx.dispose()
}
