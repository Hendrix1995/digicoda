import * as os from 'node:os'
import * as path from 'node:path'

export const DIGICODA_DIR = path.join(os.homedir(), '.digicoda')

export const PATHS = {
  dir: DIGICODA_DIR,
  state: path.join(DIGICODA_DIR, 'state.json'),
  events: path.join(DIGICODA_DIR, 'events.jsonl'),
  config: path.join(DIGICODA_DIR, 'config.json'),
  graveyard: path.join(DIGICODA_DIR, 'graveyard.jsonl'),
  hooksDir: path.join(DIGICODA_DIR, 'hooks'),
  recordJs: path.join(DIGICODA_DIR, 'hooks', 'record.js'),
  logsDir: path.join(DIGICODA_DIR, 'logs'),
} as const
