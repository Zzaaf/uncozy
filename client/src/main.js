import './style.css';
import { GameApp } from './core/GameApp.js';
import { LegendUI } from './ui/LegendUI.js';
import { LeaderboardUI } from './ui/LeaderboardUI.js';

document.querySelector('#app').innerHTML = `
  <aside id="legend-panel" class="side-panel" aria-label="How to play"></aside>
  <div id="game-shell">
    <div id="hud">
      <span id="score-label"><span id="score-text">ОЧКИ</span>: <b id="score-value">0</b></span>
      <div id="hearts"></div>
    </div>
    <div id="game-container"></div>
    <div id="overlay"></div>
  </div>
  <aside id="leaderboard-panel" class="side-panel" aria-label="Leaderboard"></aside>
`;

const legendUI      = new LegendUI(document.querySelector('#legend-panel'));
const leaderboardUI = new LeaderboardUI(document.querySelector('#leaderboard-panel'));

const app = new GameApp({
  gameContainer:     document.querySelector('#game-container'),
  overlayRoot:       document.querySelector('#overlay'),
  scoreValueElement: document.querySelector('#score-value'),
  scoreLabelElement: document.querySelector('#score-text'),
  legendUI,
  leaderboardUI,
});

app.start();
