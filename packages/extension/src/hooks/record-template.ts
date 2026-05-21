// Source for the record.js script that lives at ~/.digicoda/hooks/record.js.
// Inlined as a string so the extension can write it without bundling assets.
export const RECORD_JS = `
const fs = require('fs')
const path = require('path')
const os = require('os')

const [, , src, kind] = process.argv
const ts = Math.floor(Date.now() / 1000)
const line = JSON.stringify({ ts: ts, src: src, kind: kind }) + '\\n'

const dir = path.join(os.homedir(), '.digicoda')
try {
  fs.mkdirSync(dir, { recursive: true })
  fs.appendFileSync(path.join(dir, 'events.jsonl'), line)
} catch (e) {
  // Hooks must never block Claude Code — silently swallow failures.
}
process.exit(0)
`.trim()
