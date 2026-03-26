import { InputController } from '../input/InputController.js';
import { GameWorld } from '../game/GameWorld.js';
import { ScoreStore } from '../storage/ScoreStore.js';
import { OverlayUI } from '../ui/OverlayUI.js';

const GAME_STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  SCORES: 'scores',
  SETTINGS: 'settings',
  GAME_OVER: 'game_over',
};

export class GameApp {
  constructor({ gameContainer, overlayRoot, scoreValueElement }) {
    this.gameContainer = gameContainer;
    this.scoreValueElement = scoreValueElement;
    this.gameWorld = new GameWorld(this.gameContainer);
    this.scoreStore = new ScoreStore();
    this.playerName = this.scoreStore.getPlayerName();
    this.input = new InputController(this.gameContainer);
    this.state = GAME_STATES.MENU;
    this.rafId = null;
    this.lastTimestamp = 0;

    this.ui = new OverlayUI(overlayRoot, {
      start: () => this.startGame(),
      restart: () => this.startGame(),
      scores: () => this.showScores(),
      settings: () => this.showSettings(),
      'save-settings': (value) => this.saveSettings(value),
      back: () => this.showMenu(),
      exit: () => this.exitGame(),
    });

    this.loop = this.loop.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  start() {
    this.input.attach();
    this.showMenu();
    window.addEventListener('resize', this.handleResize);
    this.gameWorld.render();
  }

  showMenu() {
    this.state = GAME_STATES.MENU;
    this.ui.showMenu(this.playerName);
    this.updateScore(0);
  }

  showScores() {
    this.state = GAME_STATES.SCORES;
    const scores = this.scoreStore.getScores();
    this.ui.showScores(scores);
  }

  showSettings() {
    this.state = GAME_STATES.SETTINGS;
    this.ui.showSettings(this.playerName);
  }

  saveSettings(nextPlayerName) {
    this.playerName = this.scoreStore.setPlayerName(nextPlayerName);
    this.showMenu();
  }

  startGame() {
    this.gameWorld.reset();
    this.state = GAME_STATES.PLAYING;
    this.ui.hide();
    this.updateScore(0);
    this.lastTimestamp = performance.now();
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(this.loop);
  }

  loop(timestamp) {
    if (this.state !== GAME_STATES.PLAYING) {
      return;
    }

    const dt = Math.min(0.033, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;

    this.gameWorld.update(dt, this.input.getHorizontal());
    this.updateScore(this.gameWorld.score);

    if (this.gameWorld.isGameOver) {
      this.finishRun();
      return;
    }

    this.rafId = requestAnimationFrame(this.loop);
  }

  finishRun() {
    this.state = GAME_STATES.GAME_OVER;
    const saved = this.scoreStore.saveScore(this.gameWorld.score, this.playerName);
    if (!saved.length) {
      this.scoreStore.saveScore(0, this.playerName);
    }
    this.ui.showGameOver(this.gameWorld.score);
  }

  exitGame() {
    cancelAnimationFrame(this.rafId);
    this.state = GAME_STATES.MENU;
    try {
      window.close();
    } catch {
      // no-op
    }
    this.ui.showMenu();
  }

  updateScore(value) {
    this.scoreValueElement.textContent = String(Math.floor(value));
  }

  handleResize() {
    this.gameWorld.resize();
  }
}
