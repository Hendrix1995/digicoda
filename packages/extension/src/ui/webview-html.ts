import * as vscode from 'vscode'

export type WebviewMode = 'panel' | 'sidebar'

export function renderWebviewHtml(opts: {
  webview: vscode.Webview
  mode: WebviewMode
  spritesRoot: vscode.Uri
}): string {
  const { webview, mode, spritesRoot } = opts
  const spriteBase = webview.asWebviewUri(spritesRoot).toString()
  const csp = webview.cspSource
  const nonce = randomNonce()

  const compact = mode === 'sidebar'
  // In sidebar (compact) mode the stage fills the entire webview height so
  // the pet sits at the visible bottom edge, not above an empty trailing area.
  const stageH = compact ? '100%' : '180px'
  const petSize = compact ? 56 : 96

  return /* html */ `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none';
                 img-src ${csp} https: data:;
                 script-src 'nonce-${nonce}';
                 style-src ${csp} 'unsafe-inline';
                 font-src ${csp};">
  <style>
    html, body {
      margin: 0; padding: 0;
      width: 100%; height: 100%;
      background: transparent;
      color: var(--vscode-sideBar-foreground, var(--vscode-foreground));
      font-family: var(--vscode-font-family);
      overflow: hidden;
    }
    #stage {
      position: relative;
      width: 100%;
      height: ${stageH};
      background: transparent;
      overflow: hidden;
    }
    ${compact ? '' : `#stage { background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%); border-bottom: 1px solid var(--vscode-panel-border); }
    #stage::after {
      content: '';
      position: absolute;
      bottom: 0; left: 0; right: 0;
      height: 16px;
      background: rgba(0,0,0,0.4);
    }`}
    #pet {
      position: absolute;
      bottom: ${compact ? '4px' : '16px'};
      width: ${petSize}px; height: ${petSize}px;
      image-rendering: pixelated;
      object-fit: contain;
      object-position: bottom center;
      transform: translateX(-50%);
      transition: transform 0.05s linear;
    }
    #pet.flip {
      transform: translateX(-50%) scaleX(-1);
    }
    #pet.flip-only {
      transform: scaleX(-1);
    }
    #info {
      padding: 12px;
      display: ${compact ? 'none' : 'flex'};
      flex-direction: ${compact ? 'column' : 'row'};
      gap: 12px;
      font-size: 12px;
    }
    .info-block { flex: 1; }
    .info-title { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
    .info-sub { opacity: 0.7; margin-bottom: 8px; }
    .bar {
      height: 6px; background: var(--vscode-progressBar-background, #444);
      border-radius: 3px; overflow: hidden;
    }
    .bar-fill {
      height: 100%; background: var(--vscode-progressBar-foreground, #6fc);
      transition: width 0.3s ease;
    }
    .care-dots { display: flex; gap: 4px; margin-top: 4px; }
    .care-dot { width: 8px; height: 8px; border-radius: 50%; background: #444; }
    .care-dot.filled { background: #f66; }
    .row { display: flex; justify-content: space-between; margin-top: 4px; }
    .row span:first-child { opacity: 0.6; }
    #evolve-overlay {
      position: absolute;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0);
      pointer-events: none;
      transition: background 0.3s;
    }
    #evolve-overlay.active { display: flex; background: rgba(255,255,255,0.6); }
    #evolve-text {
      color: #fff;
      font-size: 18px;
      font-weight: 700;
      text-shadow: 0 0 8px #000;
    }
  </style>
</head>
<body>
  <div id="stage">
    <img id="pet" src="" />
    <div id="evolve-overlay"><div id="evolve-text"></div></div>
  </div>
  <div id="info">
    <div class="info-block">
      <div class="info-title" id="name">—</div>
      <div class="info-sub" id="stage-text">—</div>
      <div class="row"><span>XP</span><span id="xp-text">0%</span></div>
      <div class="bar"><div class="bar-fill" id="xp-bar" style="width:0%"></div></div>
      <div class="row" style="margin-top:8px"><span>Care</span><span id="care-text">0/12</span></div>
      <div class="care-dots" id="care-dots"></div>
    </div>
  </div>

  <script nonce="${nonce}">
    const SPRITE_BASE = ${JSON.stringify(spriteBase)};
    const MODE = ${JSON.stringify(mode)};

    const vscode = acquireVsCodeApi();
    const pet = document.getElementById('pet');
    const evolveOverlay = document.getElementById('evolve-overlay');
    const evolveText = document.getElementById('evolve-text');

    const STATE = {
      x: 50, dir: 1, action: 'WALK', ticksLeft: 8, frame: 0,
      sprite: null,        // digimonId, e.g. 'koromon'
      eggVariant: null,    // 1..N when stage is 'egg', drives egg sprite path
      isEgg: false,        // when true, pet does not walk and stays centered
      flip: false,         // facing direction (visual), independent of movement
      jumpTicks: 0,        // when > 0, pet is mid-jump (arc over JUMP_DURATION ticks)
    };
    const JUMP_DURATION = 14;
    const JUMP_HEIGHT = 18;

    const STAGE_W = () => document.getElementById('stage').clientWidth;
    const PET_W = ${petSize};

    function petUri(digimonId, key) {
      if (digimonId === 'egg' && STATE.eggVariant) {
        const tag = 'v' + String(STATE.eggVariant).padStart(2, '0');
        return SPRITE_BASE + '/egg/' + tag + '.png';
      }
      return SPRITE_BASE + '/' + digimonId + '/' + key + '.png';
    }

    function chooseNextAction() {
      if (STATE.isEgg) {
        STATE.action = 'IDLE';
        STATE.ticksLeft = 1000;
        return;
      }
      // Facing direction is independent of movement direction — pet might walk
      // forward, backward, or sidestep. Re-roll on every action change.
      STATE.flip = Math.random() < 0.5;
      const r = Math.random();
      if (r < 0.85) {
        STATE.action = 'WALK';
        const w = STAGE_W();
        const towardOpposite = STATE.x > w / 2 ? -1 : 1;
        STATE.dir = Math.random() < 0.7 ? towardOpposite : -towardOpposite;
        STATE.ticksLeft = 60 + Math.floor(Math.random() * 200);
      } else {
        STATE.action = 'IDLE';
        STATE.ticksLeft = 15 + Math.floor(Math.random() * 25);
      }
    }

    function maybeStartJump() {
      // ~0.6% per tick → ~one jump every 15 sec on average
      if (STATE.jumpTicks === 0 && Math.random() < 0.006) {
        STATE.jumpTicks = JUMP_DURATION;
      }
    }

    function jumpOffset() {
      if (STATE.jumpTicks <= 0) return 0;
      const progress = (JUMP_DURATION - STATE.jumpTicks) / JUMP_DURATION;
      STATE.jumpTicks--;
      // Sin arc: 0 → JUMP_HEIGHT → 0
      return Math.sin(Math.PI * progress) * JUMP_HEIGHT;
    }

    function tick() {
      STATE.frame = (STATE.frame + 1) % 1000;
      const w = STAGE_W();
      const baseBottom = ${compact ? 4 : 16};

      if (STATE.isEgg) {
        // Egg stays put: center it, no flip, no walk, very subtle bob.
        STATE.x = w / 2;
        STATE.dir = 1;
        pet.classList.remove('flip');
        pet.style.left = STATE.x + 'px';
        const bob = Math.floor(STATE.frame / 14) % 2 === 0 ? 0 : 1;
        pet.style.bottom = (baseBottom + bob) + 'px';
        if (STATE.sprite) {
          const nextSrc = petUri(STATE.sprite, 'idle');
          if (pet.src !== nextSrc) pet.src = nextSrc;
        }
        return;
      }

      maybeStartJump();
      const jy = jumpOffset();

      if (STATE.action === 'WALK') {
        STATE.x += STATE.dir * 1.2;
        if (STATE.x <= PET_W / 2) { STATE.x = PET_W / 2; STATE.dir = 1; }
        if (STATE.x >= w - PET_W / 2) { STATE.x = w - PET_W / 2; STATE.dir = -1; }
        pet.style.left = STATE.x + 'px';
        pet.classList.toggle('flip', STATE.flip);
        const useWalk = Math.floor(STATE.frame / 3) % 2 === 0;
        if (STATE.sprite) {
          const nextSrc = petUri(STATE.sprite, useWalk ? 'walk' : 'idle');
          if (pet.src !== nextSrc) pet.src = nextSrc;
        }
        pet.style.bottom = (baseBottom + (useWalk ? 2 : 0) + jy) + 'px';
      } else {
        pet.style.left = STATE.x + 'px';
        pet.classList.toggle('flip', STATE.flip);
        const bob = Math.floor(STATE.frame / 8) % 2 === 0 ? 0 : 1;
        pet.style.bottom = (baseBottom + bob + jy) + 'px';
        if (STATE.sprite) {
          const idleSrc = petUri(STATE.sprite, 'idle');
          if (pet.src !== idleSrc) pet.src = idleSrc;
        }
      }
      if (--STATE.ticksLeft <= 0) chooseNextAction();
    }

    setInterval(tick, 100);

    function applyState(s) {
      STATE.sprite = s.digimonId;
      STATE.eggVariant = (s.stage === 'egg' || s.digimonId === 'egg') ? (s.seedEggVariant || 1) : null;
      STATE.isEgg = !s.rip && (s.stage === 'egg' || s.digimonId === 'egg');
      const digimonId = s.rip ? null : s.digimonId;
      pet.src = digimonId ? petUri(digimonId, 'idle') : '';
      document.getElementById('name').textContent = s.rip
        ? 'R.I.P.'
        : prettify(s.digimonId);
      document.getElementById('stage-text').textContent = s.rip
        ? ('Died: ' + (s.rip.cause || 'unknown'))
        : (s.stage + ' · L' + (1 + Math.floor(s.xp.totalActiveSec / 3600)));

      // XP bar: progress within current stage
      const pct = s.rip ? 0 : Math.min(100, Math.floor(
        100 * s.xp.inStageActiveSec / Math.max(1, s.xpRequiredForStage || 1)
      ));
      document.getElementById('xp-bar').style.width = pct + '%';
      document.getElementById('xp-text').textContent = pct + '%';

      // Care dots
      const max = 12;
      const filled = Math.min(max, s.careMiss.inStageCount);
      document.getElementById('care-text').textContent = filled + '/' + max;
      const dots = document.getElementById('care-dots');
      dots.innerHTML = '';
      for (let i = 0; i < max; i++) {
        const d = document.createElement('div');
        d.className = 'care-dot' + (i < filled ? ' filled' : '');
        dots.appendChild(d);
      }
    }

    function flashEvolve(toName) {
      evolveText.textContent = toName + '!';
      evolveOverlay.classList.add('active');
      setTimeout(() => evolveOverlay.classList.remove('active'), 1800);
    }

    function prettify(id) {
      return id.replace(/(^|-)(\\w)/g, (_, sep, c) => (sep === '-' ? ' ' : '') + c.toUpperCase());
    }

    window.addEventListener('message', (e) => {
      const msg = e.data;
      if (msg.type === 'state') applyState(msg.state);
      if (msg.type === 'init') {
        applyState(msg.state);
        // Drop the pet at a random spot in the stage rather than always center,
        // so cold-starts don't bias toward one half.
        const w = STAGE_W();
        STATE.x = STATE.isEgg
          ? w / 2
          : PET_W / 2 + Math.random() * Math.max(0, w - PET_W);
        pet.style.left = STATE.x + 'px';
      }
      if (msg.type === 'trigger' && msg.event === 'evolve') flashEvolve(prettify(msg.toName));
    });

    vscode.postMessage({ type: 'ready' });
  </script>
</body>
</html>`
}

function randomNonce(): string {
  let s = ''
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  for (let i = 0; i < 24; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}
