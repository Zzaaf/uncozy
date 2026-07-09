import { InputController } from '../input/InputController.js';
import { GameWorld } from '../game/GameWorld.js';
import { ScoreStore } from '../storage/ScoreStore.js';
import { OverlayUI } from '../ui/OverlayUI.js';
import { AuthApi } from '../api/AuthApi.js';
import { setLang, t } from '../i18n.js';
import { INITIAL_LIVES, MAX_LIVES } from '../game/constants.js';

const GAME_STATES = {
  AUTH:      'auth',
  MENU:      'menu',
  PLAYING:   'playing',
  PAUSED:    'paused',
  SCORES:    'scores',
  SETTINGS:  'settings',
  GAME_OVER: 'game_over',
};

export class GameApp {
  constructor({ gameContainer, overlayRoot, scoreValueElement, scoreLabelElement, legendUI, leaderboardUI }) {
    this.gameContainer     = gameContainer;
    this.scoreValueElement = scoreValueElement;
    this.scoreLabelElement = scoreLabelElement;
    this.legendUI          = legendUI;
    this.leaderboardUI     = leaderboardUI;

    this.scoreStore = new ScoreStore();
    this.playerName = this.scoreStore.getPlayerName();
    this.skinId     = this.scoreStore.getSkin();
    this.lang       = this.scoreStore.getLang();
    setLang(this.lang);

    this.gameWorld = new GameWorld(this.gameContainer);
    this.input     = new InputController(this.gameContainer);
    this.state     = GAME_STATES.MENU;
    this.rafId     = null;
    this.lastTimestamp = 0;
    this._backTarget   = GAME_STATES.MENU;

    this.ui = new OverlayUI(overlayRoot, {
      start:             () => this.startGame(),
      restart:           () => this.startGame(),
      resume:            () => this.resumeGame(),
      'restart-confirm': () => this.ui.showRestartConfirm(),
      'confirm-restart': () => this.startGame(),
      'cancel-restart':  () => this.pauseGame(),
      scores:            () => this.showScores(),
      settings:          () => this.showSettings(),
      'save-settings':   (name, skinId, lang) => this.saveSettings(name, skinId, lang),
      back:              () => this._goBack(),
      exit:              () => this.exitGame(),
      logout:            () => this.logout(),
      login:             (email, password) => this.login(email, password),
      register:          (username, email, password) => this.register(username, email, password),
    });

    this.loop          = this.loop.bind(this);
    this.handleResize  = this.handleResize.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  async start() {
    this.input.attach();
    this.updateScoreLabel();
    this.lives = INITIAL_LIVES;
    this.updateHearts();
    window.addEventListener('resize',  this.handleResize);
    window.addEventListener('keydown', this.handleKeyDown);
    this.gameWorld.render();

    this.ui.showAuthLoading();
    const user = await AuthApi.me();
    if (user) {
      this.playerName = user.username;
      this.scoreStore.setPlayerName(user.username);
      this.leaderboardUI?.start();
      this.showMenu();
    } else {
      this.showAuth();
    }
  }

  showAuth() {
    this.state = GAME_STATES.AUTH;
    this.ui.showAuth();
  }

  async login(username, password) {
    try {
      const { user } = await AuthApi.login(username, password);
      this.playerName = user.username;
      this.scoreStore.setPlayerName(user.username);
      this.leaderboardUI?.start();
      this.showMenu();
    } catch (err) {
      this.ui.showAuthError(err.message);
    }
  }

  async register(username, email, password) {
    try {
      const { user } = await AuthApi.register(username, email, password);
      this.playerName = user.username;
      this.scoreStore.setPlayerName(user.username);
      this.leaderboardUI?.start();
      this.showMenu();
    } catch (err) {
      this.ui.showAuthError(err.message);
    }
  }

  logout() {
    AuthApi.logout();
    cancelAnimationFrame(this.rafId);
    this.leaderboardUI?.stop();
    this.showAuth();
  }

  handleKeyDown(e) {
    if (e.code !== 'Escape') return;
    if (this.state === GAME_STATES.PLAYING) this.pauseGame();
    else if (this.state === GAME_STATES.PAUSED) this.resumeGame();
  }

  _goBack() {
    if (this._backTarget === GAME_STATES.PAUSED) {
      this.pauseGame();
    } else {
      this.showMenu();
    }
  }

  showMenu() {
    this.state       = GAME_STATES.MENU;
    this._backTarget = GAME_STATES.MENU;
    this.ui.showMenu(this.playerName);
    this.updateScore(0);
  }

  async showScores() {
    this.state = GAME_STATES.SCORES;
    this.ui.showScores([]);
    const data = await AuthApi.getLeaderboard();
    if (data?.entries) {
      const scores = data.entries.map(e => ({ name: e.username, score: e.highScore }));
      if (data.myEntry && !data.entries.some(e => e.isMe)) {
        scores.push({ name: data.myEntry.username, score: data.myEntry.highScore });
      }
      this.ui.showScores(scores);
    }
  }

  showSettings() {
    this.state = GAME_STATES.SETTINGS;
    this.ui.showSettings(this.playerName, this.skinId, this.lang);
  }

  async saveSettings(nextName, nextSkinId, nextLang) {
    const usernameChanged = nextName && nextName !== this.playerName;
    if (usernameChanged) {
      try {
        await AuthApi.updateUsername(nextName);
      } catch (err) {
        const msg = /taken|занят/i.test(err.message)
          ? t('err_username_taken')
          : t('err_username_invalid');
        this.ui.showSettings(this.playerName, nextSkinId, this.lang, msg);
        return;
      }
      this.playerName = nextName;
      this.scoreStore.setPlayerName(nextName);
      this.leaderboardUI?.refresh();
    }
    this.skinId = this.scoreStore.setSkin(nextSkinId);
    this.lang   = this.scoreStore.setLang(nextLang);
    setLang(nextLang);
    this.updateScoreLabel();
    this.legendUI?.updateLang();
    this.leaderboardUI?.updateLang();
    this._goBack();
  }

  startGame() {
    this._backTarget = GAME_STATES.MENU;
    this.lives = INITIAL_LIVES;
    this.updateHearts();
    this.gameWorld.reset(this.skinId);
    this.state = GAME_STATES.PLAYING;
    this.ui.hide();
    this.updateScore(0);
    this.lastTimestamp = performance.now();
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(this.loop);
  }

  pauseGame() {
    this.state       = GAME_STATES.PAUSED;
    this._backTarget = GAME_STATES.PAUSED;
    cancelAnimationFrame(this.rafId);
    this.ui.showPause(this.playerName);
  }

  resumeGame() {
    this.state         = GAME_STATES.PLAYING;
    this._backTarget   = GAME_STATES.MENU;
    this.lastTimestamp = performance.now();
    this.ui.hide();
    this.rafId = requestAnimationFrame(this.loop);
  }

  loop(timestamp) {
    if (this.state !== GAME_STATES.PLAYING) return;
    const dt = Math.min(0.033, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;
    const doShoot = this.input.consumeShoot();
    this.gameWorld.update(dt, this.input.getHorizontal(), doShoot);
    this.updateScore(this.gameWorld.score);
    this.leaderboardUI?.setLiveScore(this.gameWorld.score, true);

    if (this.gameWorld.heartPickedUp) {
      this.gameWorld.heartPickedUp = false;
      // Overflow: picking up a 6th heart resets to 1
      this.lives = this.lives >= MAX_LIVES ? 1 : this.lives + 1;
      this.updateHearts();
    }

    if (this.gameWorld.isGameOver) {
      this.lives -= 1;
      this.updateHearts();
      if (this.lives <= 0) {
        this.finishRun();
        return;
      }
      this.gameWorld.respawn();
    }
    this.rafId = requestAnimationFrame(this.loop);
  }

  finishRun() {
    this.state       = GAME_STATES.GAME_OVER;
    this._backTarget = GAME_STATES.MENU;
    this.leaderboardUI?.setLiveScore(0, false);
    const score = this.gameWorld.score;
    const saved = this.scoreStore.saveScore(score, this.playerName);
    if (!saved.length) this.scoreStore.saveScore(0, this.playerName);
    AuthApi.submitScore(score);
    this.ui.showGameOver(score);
  }

  exitGame() {
    cancelAnimationFrame(this.rafId);
    this.state = GAME_STATES.MENU;
    try { window.close(); } catch { /* no-op */ }
    this.showMenu();
  }

  updateScore(value) {
    this.scoreValueElement.textContent = String(Math.floor(value));
  }

  updateHearts() {
    const el = document.getElementById('hearts');
    if (!el) return;
    let html = '';
    for (let i = 0; i < MAX_LIVES; i++) {
      const active = i >= (MAX_LIVES - this.lives); // inactive first, then active
      const fill   = active ? '#ff006e' : '#1c0c1c';
      const outline = 'drop-shadow(0 1px 0 rgba(255,255,255,0.7)) drop-shadow(0 -1px 0 rgba(255,255,255,0.7)) drop-shadow(1px 0 0 rgba(255,255,255,0.7)) drop-shadow(-1px 0 0 rgba(255,255,255,0.7))';
      const filter = active ? `${outline} drop-shadow(0 0 4px #ff006e)` : outline;
      html += `<svg viewBox="0 0 7 6" xmlns="http://www.w3.org/2000/svg"
        width="16" height="14" style="filter:${filter};image-rendering:pixelated;display:block">
        <rect x="0" y="0" width="2" height="1" fill="${fill}"/>
        <rect x="5" y="0" width="2" height="1" fill="${fill}"/>
        <rect x="0" y="1" width="7" height="2" fill="${fill}"/>
        <rect x="1" y="3" width="5" height="1" fill="${fill}"/>
        <rect x="2" y="4" width="3" height="1" fill="${fill}"/>
        <rect x="3" y="5" width="1" height="1" fill="${fill}"/>
      </svg>`;
    }
    el.innerHTML = html;
  }

  updateScoreLabel() {
    if (this.scoreLabelElement) {
      this.scoreLabelElement.textContent = t('score_label');
    }
  }

  handleResize() {
    this.gameWorld.resize();
  }
}
