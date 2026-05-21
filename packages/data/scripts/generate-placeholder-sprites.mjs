// Generates 48x48 PNG placeholder sprites per digimon entry.
// Each digimon gets a distinct color hash from its name.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import zlib from 'node:zlib'
import crypto from 'node:crypto'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const roster = JSON.parse(fs.readFileSync(path.join(root, 'roster.json'), 'utf-8'))

function colorFor(id) {
  const h = crypto.createHash('sha256').update(id).digest()
  return [h[0] ?? 0, h[1] ?? 0, h[2] ?? 0]
}

function makePng(w, h, rgb) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = chunk('IHDR', Buffer.concat([
    u32(w), u32(h),
    Buffer.from([8, 2, 0, 0, 0]),
  ]))
  // Row data: 1 byte filter + w*3 bytes RGB, repeated h times
  const rowPixels = Buffer.alloc(w * 3)
  for (let i = 0; i < w * 3; i++) rowPixels[i] = rgb[i % 3] ?? 0
  const row = Buffer.concat([Buffer.from([0]), rowPixels])
  const rows = []
  for (let i = 0; i < h; i++) rows.push(row)
  const idatRaw = Buffer.concat(rows)
  const idat = chunk('IDAT', zlib.deflateSync(idatRaw))
  const iend = chunk('IEND', Buffer.alloc(0))
  return Buffer.concat([sig, ihdr, idat, iend])
}

function u32(n) { const b = Buffer.alloc(4); b.writeUInt32BE(n, 0); return b }
function chunk(type, data) {
  const len = u32(data.length)
  const t = Buffer.from(type, 'ascii')
  const crc = crc32(Buffer.concat([t, data]))
  return Buffer.concat([len, t, data, crc])
}
const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c >>> 0
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = (crcTable[(c ^ b) & 0xff] ?? 0) ^ (c >>> 8)
  const out = Buffer.alloc(4)
  out.writeUInt32BE((c ^ 0xffffffff) >>> 0, 0)
  return out
}

const spritesDir = path.join(root, 'sprites')
fs.mkdirSync(spritesDir, { recursive: true })

let created = 0
for (const d of roster) {
  const dir = path.join(spritesDir, d.id)
  fs.mkdirSync(dir, { recursive: true })
  const rgb = colorFor(d.id)
  for (const key of ['idle', 'walk', 'happy', 'sad', 'sleep']) {
    const rel = d.sprite[key]
    if (!rel) continue
    const out = path.join(spritesDir, rel)
    fs.mkdirSync(path.dirname(out), { recursive: true })
    if (!fs.existsSync(out)) {
      fs.writeFileSync(out, makePng(48, 48, rgb))
      created++
    }
  }
}
console.log(`Created ${created} placeholder sprites`)
