/**
 * Tetris - Stage 3: Complete Edition
 * - 10x20 Matrix Grid with 7-Bag Randomizer
 * - Hold System & Next Queue (3 pieces)
 * - Ghost Piece (real-time landing guide)
 * - Official Scoring, B2B Tetris, Combo counter, and Level acceleration
 * - Web Audio API Synthesizer (Zero-dependency sound FX with Mute toggle)
 * - Visual Line Clear Particle Explosion & Screen Shake
 * - LocalStorage High Score Persistence
 * - Ergonomic Mobile/Touchscreen Controls with continuous move
 */

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // 300x600 main canvas
const PREVIEW_BLOCK_SIZE = 20; // 20px per block in preview canvases

// Standard 7 Tetromino Definitions
const TETROMINOES = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: '#00f0f0',
    light: '#70ffff',
    dark: '#009e9e'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#2e5bff',
    light: '#7092ff',
    dark: '#1436b8'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#f0a000',
    light: '#ffc866',
    dark: '#a87000'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#f0f000',
    light: '#ffff70',
    dark: '#a8a800'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: '#00f000',
    light: '#70ff70',
    dark: '#00a800'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: '#a000f0',
    light: '#d070ff',
    dark: '#6e00a8'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: '#ff3366',
    light: '#ff7094',
    dark: '#b3143c'
  }
};

/**
 * Web Audio API Sound Synthesizer (No external sound files required)
 */
class SoundController {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('tetris_muted') === 'true';
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('tetris_muted', this.muted);
    return this.muted;
  }

  playTone(freq, type, duration, gainStart = 0.15, gainEnd = 0.001) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainStart, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(gainEnd, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (_) {}
  }

  playMove() {
    this.playTone(220, 'sine', 0.04, 0.08);
  }

  playRotate() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(550, this.ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.06);
    } catch (_) {}
  }

  playSoftDrop() {
    this.playTone(130, 'triangle', 0.03, 0.07);
  }

  playHardDrop() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(140, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (_) {}
  }

  playHold() {
    this.playTone(650, 'sine', 0.08, 0.15);
  }

  playClear(lines, isTetris) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    if (isTetris) {
      // 4 lines: Triumphant Major Arpeggio Fanfare (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          this.playTone(freq, 'square', 0.18, 0.22);
        }, i * 70);
      });
    } else {
      // 1-3 lines: Rising chime
      const scale = [440, 554.37, 659.25, 880];
      for (let i = 0; i <= lines; i++) {
        setTimeout(() => {
          this.playTone(scale[i % scale.length], 'sine', 0.12, 0.18);
        }, i * 60);
      }
    }
  }

  playLevelUp() {
    const notes = [440, 554, 659, 880, 1108];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.15, 0.2);
      }, i * 50);
    });
  }

  playGameOver() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch (_) {}
  }
}

/**
 * Visual Particle System for Line Clears
 */
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawnLineParticles(row, colors) {
    const yCenter = row * BLOCK_SIZE + BLOCK_SIZE / 2;
    const count = 35; // particles per cleared line

    for (let i = 0; i < count; i++) {
      const x = Math.random() * (COLS * BLOCK_SIZE);
      const color = colors[Math.floor(Math.random() * colors.length)] || '#00f0f0';

      this.particles.push({
        x: x,
        y: yCenter + (Math.random() - 0.5) * BLOCK_SIZE,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.8) * 6,
        size: Math.random() * 5 + 3,
        color: color,
        alpha: 1.0,
        gravity: 0.25,
        decay: Math.random() * 0.025 + 0.015
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.alpha -= p.decay;

      if (p.alpha <= 0 || p.y > ROWS * BLOCK_SIZE) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    if (this.particles.length === 0) return;
    ctx.save();
    for (const p of this.particles) {
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.restore();
  }
}

/**
 * Tetris Game Controller
 */
class TetrisGame {
  constructor() {
    // Canvases
    this.canvas = document.getElementById('tetris-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.boardContainer = document.getElementById('board-container');

    this.holdCanvas = document.getElementById('hold-canvas');
    this.holdCtx = this.holdCanvas.getContext('2d');

    this.nextCanvas = document.getElementById('next-canvas');
    this.nextCtx = this.nextCanvas.getContext('2d');

    // UI Elements
    this.scoreEl = document.getElementById('score-val');
    this.linesEl = document.getElementById('lines-val');
    this.levelEl = document.getElementById('level-val');
    this.highscoreEl = document.getElementById('highscore-val');
    this.statusEl = document.getElementById('status-val');
    this.comboBoxEl = document.getElementById('combo-box');
    this.comboValEl = document.getElementById('combo-val');
    this.toastEl = document.getElementById('clear-toast');

    this.btnSound = document.getElementById('btn-sound');
    this.soundIcon = document.getElementById('sound-icon');

    this.overlayEl = document.getElementById('game-overlay');
    this.overlayTitleEl = document.getElementById('overlay-title');
    this.overlayMsgEl = document.getElementById('overlay-msg');

    this.btnRestart = document.getElementById('btn-restart');
    this.btnPause = document.getElementById('btn-pause');
    this.btnReset = document.getElementById('btn-reset');

    // Subsystems
    this.sound = new SoundController();
    this.particles = new ParticleSystem();

    this.highScore = parseInt(localStorage.getItem('tetris_highscore') || '0', 10);
    this.updateSoundButtonUI();

    this.initGame();
    this.setupEvents();
    this.setupTouchControls();
    this.startLoop();
  }

  initGame() {
    this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.combo = -1;
    this.isBackToBack = false;

    this.isGameOver = false;
    this.isPaused = false;

    // 7-Bag Randomizer & Next Queue
    this.bag = [];
    this.nextQueue = [];
    this.fillNextQueue();

    // Hold System
    this.holdPieceType = null;
    this.canHold = true;

    // Timing & Gravity
    this.dropInterval = this.calculateDropInterval();
    this.dropCounter = 0;
    this.lastTime = 0;

    this.toastTimeout = null;

    // Spawn initial piece
    this.currentPiece = this.spawnNextPiece();

    this.updateUI();
    this.drawHold();
    this.drawNext();
    this.hideOverlay();
  }

  updateSoundButtonUI() {
    if (this.sound.muted) {
      this.soundIcon.textContent = '🔇';
      this.btnSound.title = '사운드 켜기';
    } else {
      this.soundIcon.textContent = '🔊';
      this.btnSound.title = '사운드 끄기';
    }
  }

  refillBag() {
    const pieces = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    for (let i = pieces.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
    }
    this.bag = pieces;
  }

  drawFromBag() {
    if (this.bag.length === 0) {
      this.refillBag();
    }
    return this.bag.pop();
  }

  fillNextQueue() {
    while (this.nextQueue.length < 3) {
      this.nextQueue.push(this.drawFromBag());
    }
  }

  createPiece(type) {
    const tetromino = TETROMINOES[type];
    const shape = tetromino.shape.map(row => [...row]);
    const colOffset = Math.floor((COLS - shape[0].length) / 2);

    return {
      type: type,
      shape: shape,
      color: tetromino.color,
      light: tetromino.light,
      dark: tetromino.dark,
      x: colOffset,
      y: 0
    };
  }

  spawnNextPiece() {
    const nextType = this.nextQueue.shift();
    this.fillNextQueue();
    this.drawNext();

    const piece = this.createPiece(nextType);
    this.canHold = true;

    if (this.checkCollision(piece, 0, 0)) {
      this.triggerGameOver();
    }

    return piece;
  }

  holdCurrentPiece() {
    if (!this.canHold || this.isPaused || this.isGameOver || !this.currentPiece) return;

    this.sound.playHold();
    const currentType = this.currentPiece.type;

    if (this.holdPieceType === null) {
      this.holdPieceType = currentType;
      this.currentPiece = this.spawnNextPiece();
    } else {
      const tempType = this.holdPieceType;
      this.holdPieceType = currentType;
      this.currentPiece = this.createPiece(tempType);
      if (this.checkCollision(this.currentPiece, 0, 0)) {
        this.triggerGameOver();
        return;
      }
    }

    this.canHold = false;
    this.drawHold();
    this.dropCounter = 0;
  }

  calculateDropInterval() {
    return Math.max(100, Math.floor(800 * Math.pow(0.88, this.level - 1)));
  }

  checkCollision(piece, dx = 0, dy = 0, customShape = null) {
    const shape = customShape || piece.shape;
    const targetX = piece.x + dx;
    const targetY = piece.y + dy;

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const boardX = targetX + c;
          const boardY = targetY + r;

          if (boardX < 0 || boardX >= COLS) return true;
          if (boardY >= ROWS) return true;
          if (boardY >= 0 && this.board[boardY][boardX] !== null) return true;
        }
      }
    }
    return false;
  }

  getGhostPiece() {
    if (!this.currentPiece) return null;

    let ghostY = this.currentPiece.y;
    while (!this.checkCollision(this.currentPiece, 0, ghostY - this.currentPiece.y + 1)) {
      ghostY++;
    }

    return {
      shape: this.currentPiece.shape,
      color: this.currentPiece.color,
      x: this.currentPiece.x,
      y: ghostY
    };
  }

  rotateMatrix(matrix) {
    const N = matrix.length;
    const result = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        result[c][N - 1 - r] = matrix[r][c];
      }
    }
    return result;
  }

  rotateMatrixCCW(matrix) {
    const N = matrix.length;
    const result = Array.from({ length: N }, () => Array(N).fill(0));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        result[N - 1 - c][r] = matrix[r][c];
      }
    }
    return result;
  }

  rotatePiece(clockwise = true) {
    if (!this.currentPiece || this.isPaused || this.isGameOver) return;
    if (this.currentPiece.type === 'O') return;

    const rotated = clockwise
      ? this.rotateMatrix(this.currentPiece.shape)
      : this.rotateMatrixCCW(this.currentPiece.shape);

    const kicks = [
      [0, 0],
      [-1, 0],
      [1, 0],
      [0, -1],
      [-2, 0],
      [2, 0]
    ];

    for (const [kx, ky] of kicks) {
      if (!this.checkCollision(this.currentPiece, kx, ky, rotated)) {
        this.currentPiece.shape = rotated;
        this.currentPiece.x += kx;
        this.currentPiece.y += ky;
        this.sound.playRotate();
        return;
      }
    }
  }

  moveLeft() {
    if (!this.currentPiece || this.isPaused || this.isGameOver) return;
    if (!this.checkCollision(this.currentPiece, -1, 0)) {
      this.currentPiece.x -= 1;
      this.sound.playMove();
    }
  }

  moveRight() {
    if (!this.currentPiece || this.isPaused || this.isGameOver) return;
    if (!this.checkCollision(this.currentPiece, 1, 0)) {
      this.currentPiece.x += 1;
      this.sound.playMove();
    }
  }

  softDrop() {
    if (!this.currentPiece || this.isPaused || this.isGameOver) return;
    if (!this.checkCollision(this.currentPiece, 0, 1)) {
      this.currentPiece.y += 1;
      this.score += 1;
      this.sound.playSoftDrop();
      this.checkHighScore();
      this.updateUI();
    } else {
      this.lockPiece();
    }
    this.dropCounter = 0;
  }

  hardDrop() {
    if (!this.currentPiece || this.isPaused || this.isGameOver) return;
    let dropDistance = 0;
    while (!this.checkCollision(this.currentPiece, 0, 1)) {
      this.currentPiece.y += 1;
      dropDistance += 1;
    }
    this.score += dropDistance * 2;
    this.sound.playHardDrop();
    this.triggerShake(false);
    this.checkHighScore();
    this.updateUI();
    this.lockPiece();
    this.dropCounter = 0;
  }

  triggerShake(isLarge = false) {
    if (!this.boardContainer) return;
    const cls = isLarge ? 'shake-lg' : 'shake-sm';
    this.boardContainer.classList.remove('shake-sm', 'shake-lg');
    void this.boardContainer.offsetWidth; // force reflow
    this.boardContainer.classList.add(cls);
    setTimeout(() => {
      this.boardContainer.classList.remove(cls);
    }, isLarge ? 300 : 200);
  }

  lockPiece() {
    const shape = this.currentPiece.shape;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const boardX = this.currentPiece.x + c;
          const boardY = this.currentPiece.y + r;

          if (boardY < 0) {
            this.triggerGameOver();
            return;
          }

          this.board[boardY][boardX] = {
            color: this.currentPiece.color,
            light: this.currentPiece.light,
            dark: this.currentPiece.dark
          };
        }
      }
    }

    this.clearLines();
    this.currentPiece = this.spawnNextPiece();
  }

  clearLines() {
    let linesCleared = 0;
    const clearedRows = [];
    const colorsInRow = [];

    for (let r = ROWS - 1; r >= 0; r--) {
      const isFull = this.board[r].every(cell => cell !== null);
      if (isFull) {
        clearedRows.push(r);
        this.board[r].forEach(cell => {
          if (cell) colorsInRow.push(cell.color);
        });

        this.board.splice(r, 1);
        this.board.unshift(Array(COLS).fill(null));
        linesCleared++;
        r++;
      }
    }

    if (linesCleared > 0) {
      this.lines += linesCleared;
      this.combo++;

      // Spawn visual explosion particles for each cleared row
      clearedRows.forEach(row => {
        this.particles.spawnLineParticles(row, colorsInRow);
      });

      let lineBaseScore = 0;
      let toastText = '';
      let isTetris = false;

      switch (linesCleared) {
        case 1:
          lineBaseScore = 100 * this.level;
          toastText = 'SINGLE';
          this.isBackToBack = false;
          break;
        case 2:
          lineBaseScore = 300 * this.level;
          toastText = 'DOUBLE';
          this.isBackToBack = false;
          break;
        case 3:
          lineBaseScore = 500 * this.level;
          toastText = 'TRIPLE';
          this.isBackToBack = false;
          break;
        case 4:
          isTetris = true;
          this.triggerShake(true); // Huge screen shake on 4-line Tetris
          if (this.isBackToBack) {
            lineBaseScore = Math.floor(800 * this.level * 1.5);
            toastText = 'B2B TETRIS! 🔥';
          } else {
            lineBaseScore = 800 * this.level;
            toastText = 'TETRIS! ⭐';
          }
          this.isBackToBack = true;
          break;
      }

      let comboBonus = 0;
      if (this.combo > 0) {
        comboBonus = 50 * this.combo * this.level;
        toastText += ` (Combo x${this.combo})`;
      }

      this.score += lineBaseScore + comboBonus;
      this.sound.playClear(linesCleared, isTetris);
      this.showToast(toastText, isTetris);
      this.checkHighScore();

      // Level Progression
      const prevLevel = this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      if (this.level !== prevLevel) {
        this.dropInterval = this.calculateDropInterval();
        this.sound.playLevelUp();
        this.showToast(`LEVEL UP! [Lv.${this.level}]`, true);
      }

      this.updateUI();
    } else {
      this.combo = -1;
      this.updateUI();
    }
  }

  checkHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('tetris_highscore', this.highScore);
    }
  }

  showToast(text, isTetris = false) {
    if (!this.toastEl) return;
    clearTimeout(this.toastTimeout);

    this.toastEl.textContent = text;
    this.toastEl.className = isTetris ? 'clear-toast tetris-toast' : 'clear-toast';
    this.toastEl.classList.remove('hidden');

    this.toastTimeout = setTimeout(() => {
      this.toastEl.classList.add('hidden');
    }, 850);
  }

  togglePause() {
    if (this.isGameOver) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.statusEl.textContent = 'PAUSED';
      this.statusEl.className = 'stat-value status-paused';
      this.showOverlay('일시정지', 'P 키 또는 일시정지 버튼을 누르면 재개됩니다');
    } else {
      this.statusEl.textContent = 'PLAYING';
      this.statusEl.className = 'stat-value status-active';
      this.hideOverlay();
    }
  }

  triggerGameOver() {
    this.isGameOver = true;
    this.sound.playGameOver();
    this.statusEl.textContent = 'OVER';
    this.statusEl.className = 'stat-value status-over';
    this.checkHighScore();
    this.updateUI();

    const isNewRecord = this.score === this.highScore && this.score > 0;
    this.showOverlay(
      'GAME OVER',
      `${isNewRecord ? '<strong style="color:#f5c518">🏆 최고 기록 갱신! 🏆</strong><br>' : ''}` +
      `최종 점수: ${this.score.toLocaleString()}점<br>도달 레벨: ${this.level} (클리어: ${this.lines}줄)`
    );
  }

  showOverlay(title, msg) {
    this.overlayTitleEl.textContent = title;
    this.overlayMsgEl.innerHTML = msg;
    this.overlayEl.classList.remove('hidden');
  }

  hideOverlay() {
    this.overlayEl.classList.add('hidden');
  }

  updateUI() {
    this.scoreEl.textContent = this.score.toLocaleString();
    this.linesEl.textContent = this.lines.toLocaleString();
    this.levelEl.textContent = this.level;
    this.highscoreEl.textContent = this.highScore.toLocaleString();

    if (this.combo > 0) {
      this.comboValEl.textContent = this.combo;
      this.comboBoxEl.classList.remove('hidden');
    } else {
      this.comboBoxEl.classList.add('hidden');
    }
  }

  setupEvents() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      // First user interaction unlocks AudioContext on modern browsers
      this.sound.ensureContext();

      if (e.code === 'KeyP') {
        this.togglePause();
        return;
      }

      if (e.code === 'KeyR') {
        this.initGame();
        return;
      }

      if (this.isPaused || this.isGameOver) {
        if (this.isGameOver && (e.code === 'Space' || e.code === 'Enter')) {
          this.initGame();
        }
        return;
      }

      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.moveRight();
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.softDrop();
          break;
        case 'Space':
          this.hardDrop();
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'KeyX':
          this.rotatePiece(true);
          break;
        case 'KeyZ':
          this.rotatePiece(false);
          break;
        case 'KeyC':
        case 'ShiftLeft':
        case 'ShiftRight':
          this.holdCurrentPiece();
          break;
      }
    });

    this.btnRestart.addEventListener('click', () => this.initGame());
    this.btnReset.addEventListener('click', () => this.initGame());
    this.btnPause.addEventListener('click', () => this.togglePause());

    this.btnSound.addEventListener('click', () => {
      this.sound.ensureContext();
      this.sound.toggleMute();
      this.updateSoundButtonUI();
    });
  }

  // Mobile / Touchscreen controls with auto-repeat on hold
  setupTouchControls() {
    const attachTouch = (elemId, action, repeat = false) => {
      const el = document.getElementById(elemId);
      if (!el) return;

      let interval = null;
      const startAction = (e) => {
        e.preventDefault();
        this.sound.ensureContext();
        if (this.isPaused || this.isGameOver) return;
        action();
        if (repeat) {
          clearInterval(interval);
          interval = setInterval(action, 110);
        }
      };

      const stopAction = () => {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
      };

      el.addEventListener('touchstart', startAction, { passive: false });
      el.addEventListener('touchend', stopAction);
      el.addEventListener('touchcancel', stopAction);
      el.addEventListener('mousedown', startAction);
      el.addEventListener('mouseup', stopAction);
      el.addEventListener('mouseleave', stopAction);
    };

    attachTouch('touch-left', () => this.moveLeft(), true);
    attachTouch('touch-right', () => this.moveRight(), true);
    attachTouch('touch-down', () => this.softDrop(), true);
    attachTouch('touch-drop', () => this.hardDrop(), false);
    attachTouch('touch-rotate-cw', () => this.rotatePiece(true), false);
    attachTouch('touch-rotate-ccw', () => this.rotatePiece(false), false);
    attachTouch('touch-hold', () => this.holdCurrentPiece(), false);
  }

  drawHold() {
    this.holdCtx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
    if (!this.holdPieceType) return;

    const tetromino = TETROMINOES[this.holdPieceType];
    const shape = tetromino.shape;
    const blockSize = PREVIEW_BLOCK_SIZE;

    const pieceWidth = shape[0].length * blockSize;
    const pieceHeight = shape.length * blockSize;
    const offsetX = (this.holdCanvas.width - pieceWidth) / 2;
    const offsetY = (this.holdCanvas.height - pieceHeight) / 2;

    const opacity = this.canHold ? 1.0 : 0.45;
    this.drawPreviewShape(this.holdCtx, shape, tetromino, offsetX, offsetY, blockSize, opacity);
  }

  drawNext() {
    this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
    const blockSize = PREVIEW_BLOCK_SIZE;
    const slotHeight = 85;

    this.nextQueue.forEach((type, index) => {
      const tetromino = TETROMINOES[type];
      const shape = tetromino.shape;

      const pieceWidth = shape[0].length * blockSize;
      const pieceHeight = shape.length * blockSize;
      const offsetX = (this.nextCanvas.width - pieceWidth) / 2;
      const offsetY = index * slotHeight + (slotHeight - pieceHeight) / 2 + 5;

      this.drawPreviewShape(this.nextCtx, shape, tetromino, offsetX, offsetY, blockSize, 1.0);
    });
  }

  drawPreviewShape(ctx, shape, tetromino, startX, startY, blockSize, opacity = 1.0) {
    ctx.save();
    ctx.globalAlpha = opacity;
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const x = startX + c * blockSize;
          const y = startY + r * blockSize;

          ctx.fillStyle = tetromino.color;
          ctx.fillRect(x, y, blockSize, blockSize);

          ctx.fillStyle = tetromino.light;
          ctx.fillRect(x, y, blockSize, 2);
          ctx.fillRect(x, y, 2, blockSize);

          ctx.fillStyle = tetromino.dark;
          ctx.fillRect(x, y + blockSize - 2, blockSize, 2);
          ctx.fillRect(x + blockSize - 2, y, 2, blockSize);

          ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
          ctx.strokeRect(x, y, blockSize, blockSize);
        }
      }
    }
    ctx.restore();
  }

  render() {
    this.ctx.fillStyle = '#080b11';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid();

    // Draw Ghost Piece
    if (this.currentPiece && !this.isGameOver) {
      const ghost = this.getGhostPiece();
      if (ghost && ghost.y !== this.currentPiece.y) {
        this.drawGhostPiece(ghost);
      }
    }

    // Draw locked blocks
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = this.board[r][c];
        if (cell !== null) {
          this.drawBlock(c, r, cell.color, cell.light, cell.dark);
        }
      }
    }

    // Draw active moving piece
    if (this.currentPiece && !this.isGameOver) {
      const shape = this.currentPiece.shape;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] !== 0) {
            const bx = this.currentPiece.x + c;
            const by = this.currentPiece.y + r;
            if (by >= 0) {
              this.drawBlock(
                bx,
                by,
                this.currentPiece.color,
                this.currentPiece.light,
                this.currentPiece.dark
              );
            }
          }
        }
      }
    }

    // Draw Line Clear Particles
    this.particles.draw(this.ctx);
  }

  drawGhostPiece(ghost) {
    const shape = ghost.shape;
    this.ctx.save();

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const x = (ghost.x + c) * BLOCK_SIZE;
          const y = (ghost.y + r) * BLOCK_SIZE;

          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
          this.ctx.fillRect(x + 2, y + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);

          this.ctx.strokeStyle = ghost.color;
          this.ctx.lineWidth = 1.5;
          this.ctx.strokeRect(x + 1.5, y + 1.5, BLOCK_SIZE - 3, BLOCK_SIZE - 3);
        }
      }
    }
    this.ctx.restore();
  }

  drawGrid() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    this.ctx.lineWidth = 1;

    for (let c = 0; c <= COLS; c++) {
      this.ctx.beginPath();
      this.ctx.moveTo(c * BLOCK_SIZE, 0);
      this.ctx.lineTo(c * BLOCK_SIZE, ROWS * BLOCK_SIZE);
      this.ctx.stroke();
    }

    for (let r = 0; r <= ROWS; r++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, r * BLOCK_SIZE);
      this.ctx.lineTo(COLS * BLOCK_SIZE, r * BLOCK_SIZE);
      this.ctx.stroke();
    }
  }

  drawBlock(col, row, color, lightColor, darkColor) {
    const x = col * BLOCK_SIZE;
    const y = row * BLOCK_SIZE;
    const size = BLOCK_SIZE;
    const bevel = 3;

    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, size, size);

    this.ctx.fillStyle = lightColor;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x + size, y);
    this.ctx.lineTo(x + size - bevel, y + bevel);
    this.ctx.lineTo(x + bevel, y + bevel);
    this.ctx.lineTo(x + bevel, y + size - bevel);
    this.ctx.lineTo(x, y + size);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = darkColor;
    this.ctx.beginPath();
    this.ctx.moveTo(x + size, y);
    this.ctx.lineTo(x + size, y + size);
    this.ctx.lineTo(x, y + size);
    this.ctx.lineTo(x + bevel, y + size - bevel);
    this.ctx.lineTo(x + size - bevel, y + size - bevel);
    this.ctx.lineTo(x + size - bevel, y + bevel);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = color;
    this.ctx.fillRect(x + bevel, y + bevel, size - bevel * 2, size - bevel * 2);

    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.strokeRect(x, y, size, size);
  }

  startLoop() {
    const loop = (timestamp) => {
      if (!this.lastTime) this.lastTime = timestamp;
      const deltaTime = timestamp - this.lastTime;
      this.lastTime = timestamp;

      if (!this.isPaused && !this.isGameOver) {
        this.dropCounter += deltaTime;
        if (this.dropCounter > this.dropInterval) {
          if (!this.checkCollision(this.currentPiece, 0, 1)) {
            this.currentPiece.y += 1;
          } else {
            this.lockPiece();
          }
          this.dropCounter = 0;
        }
      }

      this.particles.update();
      this.render();
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.tetris = new TetrisGame();
});
