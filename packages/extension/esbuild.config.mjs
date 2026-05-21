import esbuild from 'esbuild'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const watch = process.argv.includes('--watch')

const ctx = await esbuild.context({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  external: ['vscode'],
  sourcemap: true,
  minify: false,
  logLevel: 'info',
})

function copyData() {
  // Resolve @digicoda/data package root via relative path from this config file
  const dataRoot = path.join(__dirname, '..', 'data')
  const destData = path.join(__dirname, 'dist', 'data')
  const destSprites = path.join(__dirname, 'dist', 'sprites')

  fs.mkdirSync(destData, { recursive: true })
  fs.mkdirSync(destSprites, { recursive: true })

  fs.copyFileSync(
    path.join(dataRoot, 'evolution.json'),
    path.join(destData, 'evolution.json'),
  )
  fs.copyFileSync(
    path.join(dataRoot, 'roster.json'),
    path.join(destData, 'roster.json'),
  )
  // Recursively copy sprites/
  copyDir(path.join(dataRoot, 'sprites'), destSprites)
  console.log('[digicoda] copied data files into dist/')
}

function copyDir(src, dst) {
  if (!fs.existsSync(src)) return
  fs.mkdirSync(dst, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const sp = path.join(src, entry.name)
    const dp = path.join(dst, entry.name)
    if (entry.isDirectory()) copyDir(sp, dp)
    else fs.copyFileSync(sp, dp)
  }
}

if (watch) {
  await ctx.watch()
  copyData()
} else {
  await ctx.rebuild()
  copyData()
  await ctx.dispose()
}
