import './style.css';
import { GameApp } from './core/GameApp.js';
import { LegendUI } from './ui/LegendUI.js';
import { LeaderboardUI } from './ui/LeaderboardUI.js';

document.querySelector('#app').innerHTML = `
  <aside id="legend-panel" class="side-panel side-panel--left" aria-label="How to play">
    <div class="panel-tab" role="button" tabindex="0" title="Открыть — Как играть">
      <span class="panel-tab-icon" aria-hidden="true">📖</span>
      <span class="panel-tab-text">HOW TO PLAY</span>
    </div>
    <div class="panel-body">
      <div id="legend-content"></div>
    </div>
  </aside>
  <div id="game-shell">
    <div id="hud">
      <span id="score-label"><span id="score-text">ОЧКИ</span>: <b id="score-value">0</b></span>
      <div id="hearts"></div>
    </div>
    <div id="game-container"></div>
    <div id="overlay"></div>
  </div>
  <aside id="leaderboard-panel" class="side-panel side-panel--right" aria-label="Leaderboard">
    <div class="panel-tab" role="button" tabindex="0" title="Открыть — Лидерборд">
      <span class="panel-tab-icon" aria-hidden="true">🏆</span>
      <span class="panel-tab-text">LEADERBOARD</span>
    </div>
    <div class="panel-body">
      <div id="leaderboard-content"></div>
    </div>
  </aside>
`;

const legendContent  = document.getElementById('legend-content');
const lboardContent  = document.getElementById('leaderboard-content');

// ── Panel open/close logic ────────────────────────
const legendPanel = document.getElementById('legend-panel');
const lbPanel     = document.getElementById('leaderboard-panel');

let legendOpen = false;
let lbOpen     = false;

function collapsedW() { return Math.round(Math.min(110, Math.max(80, window.innerWidth * 0.085))); }
function openW()      { return Math.round(Math.min(400, Math.max(260, window.innerWidth * 0.26)));  }

function applyW(el, w) {
  el.style.flex    = '0 0 auto';
  el.style.width   = `${w}px`;
  el.style.minWidth = `${w}px`;
  el.style.maxWidth = `${w}px`;
}

function openPanel(panel) {
  panel.classList.add('open');
  applyW(panel, openW());
  setTimeout(() => app.handleResize(), 310);
}

function closePanel(panel) {
  applyW(panel, collapsedW());
  setTimeout(() => { panel.classList.remove('open'); app.handleResize(); }, 310);
}

// Whole panel-tab is clickable to open
legendPanel.querySelector('.panel-tab').addEventListener('click', () => {
  if (!legendOpen) { legendOpen = true; openPanel(legendPanel); }
});
lbPanel.querySelector('.panel-tab').addEventListener('click', () => {
  if (!lbOpen) { lbOpen = true; openPanel(lbPanel); }
});

// Close via event delegation (close button rendered by LegendUI/LeaderboardUI)
legendContent.addEventListener('click', e => {
  if (e.target.closest('.panel-close-btn')) { legendOpen = false; closePanel(legendPanel); }
});
lboardContent.addEventListener('click', e => {
  if (e.target.closest('.panel-close-btn')) { lbOpen = false; closePanel(lbPanel); }
});

// Keyboard accessibility for panel-tab
legendPanel.querySelector('.panel-tab').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); legendPanel.querySelector('.panel-tab').click(); }
});
lbPanel.querySelector('.panel-tab').addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); lbPanel.querySelector('.panel-tab').click(); }
});

// Set initial collapsed widths immediately (no animation)
applyW(legendPanel, collapsedW());
applyW(lbPanel, collapsedW());

// Recalculate on window resize
window.addEventListener('resize', () => {
  applyW(legendPanel, legendOpen ? openW() : collapsedW());
  applyW(lbPanel,     lbOpen     ? openW() : collapsedW());
});

const legendUI = new LegendUI(legendContent, {
  onClose: () => { legendOpen = false; closePanel(legendPanel, true); },
});
const leaderboardUI = new LeaderboardUI(lboardContent, {
  onClose: () => { lbOpen = false; closePanel(lbPanel, false); },
});

const app = new GameApp({
  gameContainer:     document.querySelector('#game-container'),
  overlayRoot:       document.querySelector('#overlay'),
  scoreValueElement: document.querySelector('#score-value'),
  scoreLabelElement: document.querySelector('#score-text'),
  legendUI,
  leaderboardUI,
});

app.start();
