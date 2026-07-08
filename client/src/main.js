import './style.css';
import { GameApp } from './core/GameApp.js';

document.querySelector('#app').innerHTML = `
  <div id="game-shell">
    <div id="hud">
      <span id="score-label"><span id="score-text">ОЧКИ</span>: <b id="score-value">0</b></span>
      <div id="hearts"></div>
    </div>
    <div id="game-container"></div>
    <div id="overlay"></div>
  </div>
`;

const app = new GameApp({
  gameContainer:    document.querySelector('#game-container'),
  overlayRoot:      document.querySelector('#overlay'),
  scoreValueElement: document.querySelector('#score-value'),
  scoreLabelElement: document.querySelector('#score-text'),
});

app.start();
