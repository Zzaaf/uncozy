import './style.css';
import { GameApp } from './core/GameApp.js';

document.querySelector('#app').innerHTML = `
  <div id="game-shell">
    <div id="hud">
      <span id="score-label">Score: <b id="score-value">0</b></span>
    </div>
    <div id="game-container"></div>
    <div id="overlay"></div>
  </div>
`;

const app = new GameApp({
  gameContainer: document.querySelector('#game-container'),
  overlayRoot: document.querySelector('#overlay'),
  scoreValueElement: document.querySelector('#score-value'),
});

app.start();
