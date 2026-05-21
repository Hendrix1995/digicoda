// Convert downloaded GIFs in sprites/_raw/ into per-digimon idle.png / walk.png.
// Local-only: outputs are .gitignored (see packages/data/.gitignore).
//
// Mapping is explicit because the source pack uses Japanese/regional names and
// numeric prefixes (e.g. HolyAngemon = MagnaAngemon).

import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const rawDir = path.join(root, 'sprites', '_raw')
const outRoot = path.join(root, 'sprites')

// Each entry: GIF in _raw/ (extracts frame 0 → idle, frame 1 → walk),
// or { static: <path> } for a single-frame source used for both idle and walk.
const HOME = os.homedir()
const DPROJECT = path.join(HOME, 'Downloads/D-project-maps-items/items')
const dprj = (n) => path.join(DPROJECT, `Digimon Digital Monsters - D Project (J)-${n}.png`)

// 11 egg variants from the D-Project item sheet, extracted into sprites/egg/v01..v11.png.
// idle.png / walk.png stay as v01 (the canonical "default" egg) for back-compat.
const EGG_VARIANTS = [
  dprj(4500), dprj(4502), dprj(4503), dprj(4504), dprj(4505),
  dprj(4506), dprj(4507), dprj(4509), dprj(4510), dprj(4511),
  dprj(4513),
]

const MAP = {
  egg:                  { static: EGG_VARIANTS[0] },
  // Fresh (Baby I)
  botamon:              '021Botamon.gif',
  kuramon:              '009Kuramon.gif',
  poyomon:              '004Poyomon.gif',
  // In-training (Baby II)
  koromon:              '002Koromon.gif',
  tsunomon:             '003Tsunomon.gif',
  tokomon:              '005Tokomon.gif',
  // Rookie (Child)
  agumon:               '025AgumonSavers.gif',
  gabumon:              '030Gabumon.gif',
  patamon:              '031Patamon.gif',
  // Champion (Adult)
  greymon:              '086Greymon.gif',
  monochromon:          '181Monochromon.gif',
  darktyrannomon:       '131DarkTyrannomon.gif',
  garurumon:            '093Garurumon.gif',
  leomon:               '100Leomon.gif',
  saberdramon:          '165Saberdramon.gif',
  ogremon:              '096Ogremon.gif',
  angemon:              '094Angemon.gif',
  birdramon:            '110Birdramon.gif',
  centarumon:           '185Centarumon.gif',
  devimon:              '088Devimon.gif',
  raremon:              '102Raremon.gif',
  numemon:              '091Numemon.gif',
  // Ultimate (Perfect)
  metalgreymon:         '195MetalGreymon.gif',
  mammothmon:           '204Mammothmon.gif',
  metaltyrannomon:      '269MetalTyrannomon.gif',
  skullgreymon:         '197SkullGreymon.gif',
  weregarurumon:        '214WereGarurumon.gif',
  weregarurumonblack:   '213WereGarurumonBlack.gif',
  saberleomon:          '300SaberLeomon.gif',
  garudamon:            '217Garudamon.gif',
  magnaangemon:         '223HolyAngemon.gif',
  vamdemon:             '215Vamdemon.gif',
  ladydevimon:          '216LadyDevimon.gif',
  etemon:               '200Etemon.gif',
  // Mega
  wargreymon:           '309WarGreymon.gif',
  blackwargreymon:      '363BlackWarGreymon.gif',
  metalgarurumon:       '310MetalGarurumon.gif',
  seraphimon:           '318Seraphimon.gif',
  piedmon:              '304Piedmon.gif',
}

// `-trim +repage` strips transparent padding so feet sit at PNG bottom edge.
function extractFrame(src, frameIdx, out) {
  execFileSync('magick', [
    `${src}[${frameIdx}]`,
    '-background', 'none',
    '-trim', '+repage',
    `PNG32:${out}`,
  ])
}

function extractStatic(src, out) {
  execFileSync('magick', [
    src,
    '-background', 'none',
    '-trim', '+repage',
    `PNG32:${out}`,
  ])
}

let done = 0, skipped = 0
for (const [id, entry] of Object.entries(MAP)) {
  const outDir = path.join(outRoot, id)
  fs.mkdirSync(outDir, { recursive: true })
  const idle = path.join(outDir, 'idle.png')
  const walk = path.join(outDir, 'walk.png')

  if (typeof entry === 'object' && entry.static) {
    if (!fs.existsSync(entry.static)) {
      console.warn(`[skip] ${id}: ${entry.static} not found`)
      skipped++
      continue
    }
    extractStatic(entry.static, idle)
    extractStatic(entry.static, walk)
    console.log(`  ${id.padEnd(14)} ← ${path.basename(entry.static)} (static)`)
  } else {
    const src = path.join(rawDir, entry)
    if (!fs.existsSync(src)) {
      console.warn(`[skip] ${id}: source not found (${entry})`)
      skipped++
      continue
    }
    extractFrame(src, 0, idle)
    extractFrame(src, 1, walk)
    console.log(`  ${id.padEnd(14)} ← ${entry}`)
  }
  done++
}

// Egg variants → sprites/egg/v01.png ... vNN.png (used at runtime to pick a
// random hatching egg per pet).
const eggDir = path.join(outRoot, 'egg')
fs.mkdirSync(eggDir, { recursive: true })
let eggCount = 0
for (let i = 0; i < EGG_VARIANTS.length; i++) {
  const src = EGG_VARIANTS[i]
  if (!fs.existsSync(src)) {
    console.warn(`[egg] variant ${i + 1} missing: ${src}`)
    continue
  }
  const tag = 'v' + String(i + 1).padStart(2, '0')
  extractStatic(src, path.join(eggDir, `${tag}.png`))
  eggCount++
}
console.log(`Egg variants: ${eggCount}`)

// Extension icon — Koromon, upscaled to 128×128 with nearest-neighbor so the
// pixel art stays crisp. Lives in packages/extension/icon.png (gitignored).
const koromonIdle = path.join(outRoot, 'koromon', 'idle.png')
const iconOut = path.join(__dirname, '..', '..', 'extension', 'icon.png')
if (fs.existsSync(koromonIdle)) {
  execFileSync('magick', [
    koromonIdle,
    '-background', 'none',
    '-filter', 'point',
    '-resize', '128x128',
    '-gravity', 'center',
    '-extent', '128x128',
    `PNG32:${iconOut}`,
  ])
  console.log('Extension icon: koromon → packages/extension/icon.png')
}

console.log(`\nExtracted ${done} digimon (${skipped} skipped).`)
