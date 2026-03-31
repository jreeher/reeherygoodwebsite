// platformer.js — Jordan Reeher's Homepage Platformer
// Playable endless runner: Space / ArrowUp / Tap to jump
// Characters: Rubisnail (YOU), Deano the Dino, Hank the Coconut Cowboy

(function () {
  'use strict';

  const canvas = document.getElementById('platformer');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  // ─────────────────────────────────────────────────────────
  //  PIXEL ART SPRITES
  //  Each cell = SCALE px × SCALE px on canvas
  //  Color key: '.' = transparent
  // ─────────────────────────────────────────────────────────
  const SCALE = 4;

  const PAL = {
    '.': null,
    // ── Rubisnail (purple snail) ──
    'P': '#6B1FA8',  // dark purple shell
    'p': '#B07DEB',  // light purple
    'L': '#8B44CC',  // mid purple
    'w': '#FFFFFF',  // white (eye)
    'B': '#F5C89A',  // peach body
    'b': '#D4956A',  // dark peach (feet)
    // ── Deano the Dino (green dinosaur) ──
    'G': '#196B30',  // dark green
    'g': '#27AE60',  // bright green
    'k': '#1A5C28',  // darker green (shade)
    'e': '#F0F8F0',  // near-white (eye)
    'S': '#D4A017',  // golden spine
    // ── Hank the Coconut Cowboy ──
    'C': '#5C3010',  // dark brown coconut
    'c': '#8B5E3C',  // medium brown
    'H': '#D2A468',  // tan hat
    'h': '#A07840',  // dark tan
    't': '#4A2E10',  // hat band (dark)
  };

  function drawSprite(grid, ox, oy) {
    for (let r = 0; r < grid.length; r++) {
      const row = grid[r];
      for (let c = 0; c < row.length; c++) {
        const col = PAL[row[c]];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(Math.round(ox + c * SCALE), Math.round(oy + r * SCALE), SCALE, SCALE);
      }
    }
  }

  // ── Rubisnail — 12 × 10 (48 × 40 canvas px) ──
  // Snail facing right: shell on top, slug body below, eye on right side
  const SPR_RUBY = [
    '....PPPP....',
    '...PPpLPP...',
    '..PPpLLpPP..',
    '..PPppppPP..',
    '...PPPPPP...',
    '..BBBBBBBww.',
    '.BBBBBBBBBBB',
    '..BBBBBBB b.',
    '...bBBb.....',
    '....bb......',
  ];
  const RUBY_W = SPR_RUBY[0].length * SCALE;   // 48
  const RUBY_H = SPR_RUBY.length    * SCALE;   // 40

  // ── Deano the Dino — 10 × 13 (40 × 52 canvas px) ──
  // Small pixel T-Rex/dino facing right
  const SPR_DEANO = [
    '...GGGG...',
    '..GGggGG..',
    '.GGgeGgGG.',  // eye
    '.GGGGGGG..',
    'GkGSSSkGG.',  // spines on back
    'GGGGGGGGG.',
    '.GGGGGGGG.',
    '..GGGGGGG.',
    '..GGGkGG..',
    '..GG..GG..',
    '.GGG..GGG.',
    '.GG....GG.',
    '..G....G..',
  ];
  const DEANO_W = SPR_DEANO[0].length * SCALE;  // 40
  const DEANO_H = SPR_DEANO.length    * SCALE;  // 52

  // ── Hank the Coconut Cowboy — 10 × 13 (40 × 52 canvas px) ──
  // Round coconut body with cowboy hat on top
  const SPR_HANK = [
    '..HHHHHH..',  // hat brim
    '.HHhtthHH.',  // hat + band
    '.HHHHHHHH.',  // hat top
    '..HHHHHH..',  // hat bottom
    '.CCCCCCCC.',  // coconut top
    'CCCccccCCC',
    'CCcwwwcCCC',  // eyes
    'CCCccccCCC',
    '.CCCCCCCC.',
    '..CCCCCC..',
    '..CC..CC..',
    '.CCC..CCC.',
    '.CC....CC.',
  ];
  const HANK_W = SPR_HANK[0].length * SCALE;   // 40
  const HANK_H = SPR_HANK.length    * SCALE;   // 52

  // ─────────────────────────────────────────────────────────
  //  CANVAS SIZING
  // ─────────────────────────────────────────────────────────
  let GROUND_Y = 400;

  function resizeCanvas() {
    const w = canvas.parentElement ? canvas.parentElement.offsetWidth : window.innerWidth;
    const h = Math.min(450, Math.floor(window.innerHeight * 0.55));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width  = w;
      canvas.height = h;
    }
    GROUND_Y = canvas.height - 44;
    initPositions();
  }

  window.addEventListener('resize', () => { resizeCanvas(); stars = null; });

  // ─────────────────────────────────────────────────────────
  //  STARS (static background)
  // ─────────────────────────────────────────────────────────
  let stars = null;
  function buildStars() {
    stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height * 0.65),
      s: Math.random() * 1.5 + 0.5,
      a: Math.random() * 0.5 + 0.2,
    }));
  }

  // ─────────────────────────────────────────────────────────
  //  GAME STATE
  // ─────────────────────────────────────────────────────────
  const BASE_SPEED = 2.4;
  let scrollSpeed  = BASE_SPEED;
  let worldX       = 0;
  let running      = false;
  let hintAlpha    = 1;
  let hintTimer    = 0;
  let qTriggered   = false;

  // ─────────────────────────────────────────────────────────
  //  OBSTACLES
  // ─────────────────────────────────────────────────────────
  let obstacles   = [];
  let nextSpawnAt = 480;

  function spawnObstacle() {
    const roll = Math.random();
    let type;
    if (!qTriggered && worldX > 350 && roll < 0.13) {
      type = 'qblock';
    } else if (roll < 0.5) {
      type = 'pipe';
    } else {
      type = 'bricks';
    }

    let obs = { type, hit: false };

    if (type === 'pipe') {
      obs.w = 44;
      obs.h = 58 + Math.random() * 46;
      obs.x = canvas.width + 10;
      obs.y = GROUND_Y - obs.h;

    } else if (type === 'bricks') {
      const cols = 2 + Math.floor(Math.random() * 2);
      obs.w = cols * 32;
      obs.h = 32;
      obs.x = canvas.width + 10;
      obs.y = GROUND_Y - obs.h;

    } else { // qblock
      obs.w = 32;
      obs.h = 32;
      obs.x = canvas.width + 10;
      obs.floating = Math.random() < 0.5;
      obs.y = obs.floating
        ? GROUND_Y - 88 - Math.random() * 44
        : GROUND_Y - 32;
    }

    obstacles.push(obs);
    nextSpawnAt = worldX + 330 + Math.random() * 240;
  }

  // ─────────────────────────────────────────────────────────
  //  CHARACTERS
  // ─────────────────────────────────────────────────────────
  function makeChar(name, frac, w, h) {
    return { name, frac, x: 0, y: 0, w, h, vy: 0, onGround: false,
             jumpsLeft: 2, flashing: 0, jumpCooldown: 0 };
  }

  const player = makeChar('ruby',  0.12, RUBY_W,  RUBY_H);
  const npc1   = makeChar('deano', 0.35, DEANO_W, DEANO_H);
  const npc2   = makeChar('hank',  0.55, HANK_W,  HANK_H);
  const chars  = [player, npc1, npc2];

  function initPositions() {
    chars.forEach(ch => {
      ch.x = Math.floor(canvas.width * ch.frac);
      ch.y = GROUND_Y - ch.h;
      ch.vy = 0;
      ch.onGround = true;
      ch.jumpsLeft = 2;
    });
  }

  // ─────────────────────────────────────────────────────────
  //  PHYSICS
  // ─────────────────────────────────────────────────────────
  const GRAVITY    = 0.55;
  const JUMP_VEL   = -13.5;

  function applyPhysics(ch) {
    ch.vy += GRAVITY;
    ch.y  += ch.vy;
    if (ch.y + ch.h >= GROUND_Y) {
      ch.y       = GROUND_Y - ch.h;
      ch.vy      = 0;
      ch.onGround = true;
      if (ch === player) ch.jumpsLeft = 2;
    } else {
      ch.onGround = false;
    }
  }

  function doJump(ch) {
    if (ch === player) {
      if (ch.jumpsLeft > 0) {
        ch.vy = JUMP_VEL;
        ch.jumpsLeft--;
        ch.onGround = false;
        if (!running) running = true;
      }
    } else {
      if (ch.onGround) {
        ch.vy = JUMP_VEL;
        ch.onGround = false;
      }
    }
  }

  function checkCollision(ch, obs) {
    const cx1 = ch.x,         cy1 = ch.y;
    const cx2 = ch.x + ch.w,  cy2 = ch.y + ch.h;
    const ox1 = obs.x,        oy1 = obs.y;
    const ox2 = obs.x + obs.w, oy2 = obs.y + obs.h;

    // No overlap
    if (cx2 <= ox1 || cx1 >= ox2 || cy2 <= oy1 || cy1 >= oy2) return;

    // ── Land on top ──
    const prevBottom = cy2 - ch.vy;
    if (prevBottom <= oy1 + 8 && ch.vy >= 0) {
      ch.y       = oy1 - ch.h;
      ch.vy      = 0;
      ch.onGround = true;
      if (ch === player) ch.jumpsLeft = 2;
      return;
    }

    // ── Hit q-block from below (player only) ──
    if ((obs.type === 'qblock') && obs.floating && !obs.hit && ch === player) {
      const prevTop = cy1 - ch.vy;
      if (prevTop >= oy2 - 6 && ch.vy < 0) {
        ch.vy = 4;
        obs.hit = true;
        triggerQBlock();
        return;
      }
    }

    // ── Side collision: flash + soft bounce ──
    if (ch.flashing === 0) {
      ch.flashing = 55;
      if (ch.onGround) {
        ch.vy = JUMP_VEL * 0.5;
        ch.onGround = false;
      }
    }
  }

  function triggerQBlock() {
    if (qTriggered) return;
    qTriggered = true;
    if (typeof launchConfetti === 'function') launchConfetti(60);
    if (typeof showEaster === 'function') {
      showEaster(
        'SECRET BLOCK!',
        "You found the hidden ? block — Jordan put it here just for you!\n\n\"Sometimes the best surprises are the ones you jump right into.\""
      );
    }
  }

  // ─────────────────────────────────────────────────────────
  //  NPC AI  (look ahead, maybe jump)
  // ─────────────────────────────────────────────────────────
  const AI = {
    deano: { look: 155, miss: 0.08 },
    hank:  { look: 115, miss: 0.27 },
  };

  function npcThink(npc) {
    if (!npc.onGround) return;
    if (npc.jumpCooldown > 0) { npc.jumpCooldown--; return; }
    const ai = AI[npc.name];
    if (!ai) return;
    for (const obs of obstacles) {
      const gap = obs.x - (npc.x + npc.w);
      if (gap > 0 && gap < ai.look) {
        if (Math.random() >= ai.miss) doJump(npc);
        npc.jumpCooldown = (15 + Math.random() * 30) | 0;
        break;
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  //  INPUT
  // ─────────────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'ArrowUp') {
      const r = canvas.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) e.preventDefault();
      doJump(player);
    }
  });

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    doJump(player);
  }, { passive: false });

  canvas.addEventListener('click', () => doJump(player));

  // ─────────────────────────────────────────────────────────
  //  DRAWING HELPERS
  // ─────────────────────────────────────────────────────────

  // Pipe
  function drawPipe(o) {
    const { x, y, w, h } = o;
    const bx = x + 4, bw = w - 8, cy = y + 16;
    // body
    ctx.fillStyle = '#28A745'; ctx.fillRect(bx, cy, bw, h - 16);
    ctx.fillStyle = '#5CDB5C'; ctx.fillRect(bx, cy, 7, h - 16);
    ctx.fillStyle = '#3AB85A'; ctx.fillRect(bx + 2, cy, 3, h - 16);
    ctx.fillStyle = '#1A7A2E'; ctx.fillRect(bx + bw - 3, cy, 3, h - 16);
    // cap
    ctx.fillStyle = '#28A745'; ctx.fillRect(x - 4, y, w + 8, 16);
    ctx.fillStyle = '#5CDB5C'; ctx.fillRect(x - 4, y, w + 8, 4);
    ctx.fillRect(x - 4, y + 4, 6, 12);
    ctx.fillStyle = '#1A7A2E'; ctx.fillRect(x + w + 4 - 3, y, 3, 16);
  }

  // Brick blocks
  function drawBricks(o) {
    const cols = Math.max(1, Math.round(o.w / 32));
    for (let i = 0; i < cols; i++) {
      const bx = o.x + i * 32, by = o.y;
      ctx.fillStyle = '#9E4A1E'; ctx.fillRect(bx, by, 32, 32);
      // highlights & shadow
      ctx.fillStyle = '#C06030'; ctx.fillRect(bx + 2, by + 2, 28, 5);
      ctx.fillStyle = '#6B2E0E';
      ctx.fillRect(bx,      by,  32, 2);  // top edge
      ctx.fillRect(bx,      by,   2, 32); // left edge
      ctx.fillRect(bx + 30, by,   2, 32); // right edge
      ctx.fillRect(bx,      by+30, 32, 2); // bottom edge
      // mortar
      ctx.fillRect(bx, by + 14, 32, 3);   // horizontal
      // vertical mortar (offset per column)
      if (i % 2 === 0) ctx.fillRect(bx + 14, by, 3, 14);
      else             ctx.fillRect(bx + 16, by + 17, 3, 15);
    }
  }

  // Question block
  function drawQBlock(o) {
    const { x, y } = o;
    if (o.hit) {
      ctx.fillStyle = '#7A5200'; ctx.fillRect(x, y, 32, 32);
      ctx.fillStyle = '#5A3A00'; ctx.fillRect(x, y, 32, 2); ctx.fillRect(x, y, 2, 32);
      return;
    }
    ctx.fillStyle = '#FFD700'; ctx.fillRect(x, y, 32, 32);
    ctx.fillStyle = '#FFF066'; ctx.fillRect(x, y, 32, 3); ctx.fillRect(x, y, 3, 32);
    ctx.fillStyle = '#A07800';
    ctx.fillRect(x + 29, y, 3, 32); ctx.fillRect(x, y + 29, 32, 3);
    ctx.fillStyle = '#5B3000';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', x + 16, y + 17);
  }

  // Ground
  function drawGround() {
    // green strip
    ctx.fillStyle = '#3EA03E'; ctx.fillRect(0, GROUND_Y, canvas.width, 5);
    ctx.fillStyle = '#2A7A2A'; ctx.fillRect(0, GROUND_Y + 5, canvas.width, 9);
    // dirt
    ctx.fillStyle = '#7A4E2A'; ctx.fillRect(0, GROUND_Y + 14, canvas.width, 30);
    // scrolling texture lines
    ctx.fillStyle = '#6B3E1E';
    const off = Math.floor(worldX * 0.5) % 32;
    for (let x = -off; x < canvas.width; x += 32) {
      ctx.fillRect(x,     GROUND_Y + 18, 18, 2);
      ctx.fillRect(x + 6, GROUND_Y + 27, 16, 2);
    }
  }

  // Character sprites
  function drawChar(ch) {
    if (ch.flashing > 0 && Math.floor(ch.flashing / 6) % 2 === 0) return;
    if      (ch.name === 'ruby')  drawSprite(SPR_RUBY,  ch.x, ch.y);
    else if (ch.name === 'deano') drawSprite(SPR_DEANO, ch.x, ch.y);
    else if (ch.name === 'hank')  drawSprite(SPR_HANK,  ch.x, ch.y);
  }

  // HUD
  function drawHUD() {
    // Distance counter
    const dist = Math.floor(worldX / 60);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = 'bold 13px Oswald, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(dist + ' m', canvas.width - 12, 10);

    // Character labels
    ctx.font = '600 10px Nunito, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textBaseline = 'top';
    ctx.textAlign = 'center';
    const ly = GROUND_Y + 2;
    ctx.fillText('YOU',   player.x + player.w / 2, ly);
    ctx.fillText('DEANO', npc1.x   + npc1.w   / 2, ly);
    ctx.fillText('HANK',  npc2.x   + npc2.w   / 2, ly);

    // Jump hint (fades after a few seconds of running)
    if (hintAlpha > 0) {
      ctx.globalAlpha = hintAlpha;
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.font = '700 13px Oswald, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('SPACE  /  TAP TO JUMP', canvas.width / 2, 12);
      ctx.globalAlpha = 1;
    }
  }

  // ─────────────────────────────────────────────────────────
  //  UPDATE
  // ─────────────────────────────────────────────────────────
  function update() {
    if (!running) return;

    scrollSpeed = Math.min(scrollSpeed + 0.0004, 6.5);
    worldX += scrollSpeed;

    // Scroll obstacles
    for (const o of obstacles) o.x -= scrollSpeed;
    obstacles = obstacles.filter(o => o.x + o.w > -20);

    // Spawn new obstacle when worldX crosses threshold
    if (worldX >= nextSpawnAt) spawnObstacle();

    // Physics
    chars.forEach(applyPhysics);

    // Collisions
    for (const o of obstacles) chars.forEach(ch => checkCollision(ch, o));

    // NPC AI
    npcThink(npc1);
    npcThink(npc2);

    // Flash countdown
    chars.forEach(ch => { if (ch.flashing > 0) ch.flashing--; });

    // Hint fade (fades out after ~3 s of gameplay)
    hintTimer++;
    if (hintTimer > 180) hintAlpha = Math.max(0, hintAlpha - 0.008);
  }

  // ─────────────────────────────────────────────────────────
  //  DRAW (full frame)
  // ─────────────────────────────────────────────────────────
  function draw() {
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0,   '#0D1B2A');
    sky.addColorStop(0.7, '#14213D');
    sky.addColorStop(1,   '#1A2E1A');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Stars
    if (!stars) buildStars();
    stars.forEach(s => {
      ctx.globalAlpha = s.a;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(s.x, s.y, s.s * 2, s.s * 2);
    });
    ctx.globalAlpha = 1;

    drawGround();

    // Obstacles (back-to-front)
    obstacles.forEach(o => {
      if      (o.type === 'pipe')   drawPipe(o);
      else if (o.type === 'bricks') drawBricks(o);
      else                          drawQBlock(o);
    });

    // Characters
    chars.forEach(drawChar);

    drawHUD();
  }

  // ─────────────────────────────────────────────────────────
  //  MAIN LOOP
  // ─────────────────────────────────────────────────────────
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  // First draw before game starts (idle state)
  resizeCanvas();
  buildStars();
  draw();
  requestAnimationFrame(loop);

})();
