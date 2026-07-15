import { t, getLang } from '../i18n.js';

// Skin SVGs reused from OverlayUI
const SKINS = [
  `<svg viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="0" width="12" height="10" fill="#ffdd00"/>
    <rect x="4" y="10" width="16" height="16" fill="#ffdd00"/>
    <rect x="4" y="13" width="16" height="6" fill="#ff006e"/>
    <rect x="13" y="14" width="5" height="4" fill="white"/>
    <rect x="14" y="14" width="4" height="4" fill="#00e5ff"/>
    <rect x="5" y="26" width="5" height="8" fill="#ffdd00"/>
    <rect x="14" y="26" width="5" height="8" fill="#ffdd00"/>
  </svg>`,
  `<svg viewBox="0 0 24 38" xmlns="http://www.w3.org/2000/svg">
    <rect x="3"  y="4"  width="18" height="14" fill="#8899aa"/>
    <rect x="5"  y="8"  width="14" height="6"  fill="#ff2200"/>
    <rect x="9"  y="9"  width="6"  height="4"  fill="#ff6644"/>
    <rect x="1"  y="18" width="22" height="14" fill="#6677aa"/>
    <rect x="5"  y="20" width="14" height="8"  fill="#222244"/>
    <rect x="7"  y="22" width="3"  height="2"  fill="#00ff88"/>
    <rect x="14" y="22" width="3"  height="2"  fill="#ff2200"/>
    <rect x="4"  y="32" width="6"  height="6"  fill="#8899aa"/>
    <rect x="14" y="32" width="6"  height="6"  fill="#8899aa"/>
  </svg>`,
  `<svg viewBox="0 0 24 42" xmlns="http://www.w3.org/2000/svg">
    <rect x="8"  y="0"  width="8"  height="8"  fill="#8800cc"/>
    <rect x="1"  y="8"  width="22" height="3"  fill="#ffdd00"/>
    <rect x="5"  y="11" width="14" height="10" fill="#ffccaa"/>
    <rect x="7"  y="14" width="4"  height="4"  fill="#9900ff"/>
    <rect x="13" y="14" width="4"  height="4"  fill="#9900ff"/>
    <rect x="0"  y="21" width="24" height="18" fill="#6600aa"/>
    <rect x="2"  y="28" width="20" height="2"  fill="#ffdd00"/>
    <rect x="10" y="23" width="4"  height="4"  fill="#ffdd00"/>
  </svg>`,
];

const CUBE_COLORS = ['#00ff88', '#00e5ff', '#ff006e', '#ffdd00', '#aa44ff', '#00ff88'];

function cubeRow(colors, yOffsets = null) {
  const W = 10, GAP = 3;
  return colors.map((c, i) => {
    const x = i * (W + GAP);
    const y = yOffsets ? yOffsets[i] : 0;
    return `<rect x="${x}" y="${y}" width="${W}" height="${W}" fill="${c}" rx="1"/>`;
  }).join('');
}

function platNormal() {
  const W = 10, GAP = 3;
  const total = CUBE_COLORS.length * (W + GAP) - GAP;
  return `<svg viewBox="0 0 ${total} 12" width="${total}" height="12" xmlns="http://www.w3.org/2000/svg">
    ${cubeRow(CUBE_COLORS)}
  </svg>`;
}

function platSuper() {
  const W = 10, GAP = 3;
  const whites = Array(6).fill('#ffffff');
  const total = whites.length * (W + GAP) - GAP;
  return `<svg viewBox="-2 -2 ${total + 4} 16" width="${total}" height="12" xmlns="http://www.w3.org/2000/svg">
    <rect x="-2" y="-2" width="${total + 4}" height="14" fill="rgba(136,255,255,0.12)" rx="2"/>
    ${cubeRow(whites)}
  </svg>`;
}

function platFloat() {
  const W = 10, GAP = 3;
  const colors = Array(6).fill('#aa44ff');
  const total = colors.length * (W + GAP) - GAP;
  // Wave shape: cubes at different Y positions to show "floating"
  const yOff = [2, 0, 3, 1, 0, 2];
  const maxY = Math.max(...yOff);
  return `<svg viewBox="0 0 ${total} ${W + maxY + 2}" width="${total}" height="${W + maxY + 2}" xmlns="http://www.w3.org/2000/svg" class="plat-float-svg">
    ${colors.map((c, i) => {
      const x = i * (W + GAP);
      const y = yOff[i];
      return `<rect class="fc" x="${x}" y="${y}" width="${W}" height="${W}" fill="${c}" rx="1" style="animation-delay:${(i * 0.18).toFixed(2)}s"/>`;
    }).join('')}
  </svg>`;
}

function platBarrier() {
  const W = 10, GAP = 3;
  const colors = Array(6).fill('#ff2244');
  const total = colors.length * (W + GAP) - GAP;
  return `<svg viewBox="-1 -1 ${total + 2} 12" width="${total}" height="10" xmlns="http://www.w3.org/2000/svg">
    <rect x="-1" y="-1" width="${total + 2}" height="12" fill="rgba(255,34,68,0.15)" rx="1"/>
    ${cubeRow(colors)}
  </svg>`;
}

function heartSvg() {
  return `<svg viewBox="0 0 14 12" width="20" height="17" xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="4" height="2" fill="#ff1177"/>
    <rect x="10" y="0" width="4" height="2" fill="#ff1177"/>
    <rect x="0" y="2" width="14" height="4" fill="#ff1177"/>
    <rect x="2" y="6" width="10" height="2" fill="#ff1177"/>
    <rect x="4" y="8" width="6" height="2" fill="#ff1177"/>
    <rect x="6" y="10" width="2" height="2" fill="#ff1177"/>
  </svg>`;
}

function section(titleRu, titleEn, body) {
  return `
    <div class="lg-section">
      <div class="lg-section-title" data-ru="${titleRu}" data-en="${titleEn}">${titleRu}</div>
      ${body}
    </div>`;
}

function keyChip(label) {
  return `<span class="lg-key">${label}</span>`;
}

function controlRow(keys, descRu, descEn) {
  const keyHtml = keys.map(keyChip).join('');
  return `<div class="lg-ctrl-row">
    <div class="lg-ctrl-keys">${keyHtml}</div>
    <div class="lg-ctrl-desc" data-ru="${descRu}" data-en="${descEn}">${descRu}</div>
  </div>`;
}

function platRow(svgHtml, descRu, descEn, extra = '') {
  return `<div class="lg-plat-row">
    <div class="lg-plat-icon">${svgHtml}</div>
    <div class="lg-plat-desc">
      <span class="lg-plat-name" data-ru="${descRu}" data-en="${descEn}">${descRu}</span>
      ${extra ? `<span class="lg-plat-note">${extra}</span>` : ''}
    </div>
  </div>`;
}

// ── Enemy mini-icons (SVG) ────────────────────────────────────────────────────

function enemyCrawlerSvg() {
  return `<svg viewBox="0 0 28 18" width="28" height="18" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="4" width="20" height="10" fill="#ff2244"/>
    <rect x="2" y="6" width="5" height="5" fill="#cc1122"/>
    <rect x="21" y="6" width="5" height="5" fill="#cc1122"/>
    <rect x="7" y="5" width="4" height="4" fill="#ffffff"/>
    <rect x="17" y="5" width="4" height="4" fill="#ffffff"/>
    <rect x="8" y="6" width="2" height="2" fill="#110000"/>
    <rect x="18" y="6" width="2" height="2" fill="#110000"/>
    <rect x="6" y="14" width="2" height="4" fill="#aa0022"/>
    <rect x="10" y="14" width="2" height="4" fill="#aa0022"/>
    <rect x="16" y="14" width="2" height="4" fill="#aa0022"/>
    <rect x="20" y="14" width="2" height="4" fill="#aa0022"/>
  </svg>`;
}

function enemyFlyerSvg() {
  return `<svg viewBox="0 0 32 16" width="32" height="16" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="8" height="6" fill="#006622"/>
    <rect x="22" y="4" width="8" height="6" fill="#006622"/>
    <rect x="10" y="2" width="12" height="10" fill="#00bb44"/>
    <rect x="12" y="3" width="3" height="3" fill="#ffdd00"/>
    <rect x="17" y="3" width="3" height="3" fill="#ffdd00"/>
    <rect x="13" y="12" width="2" height="3" fill="#004422"/>
    <rect x="17" y="12" width="2" height="3" fill="#004422"/>
  </svg>`;
}

function enemyShooterSvg() {
  return `<svg viewBox="0 0 30 18" width="30" height="18" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="8" width="26" height="4" fill="#00ccbb"/>
    <rect x="9" y="2" width="12" height="7" fill="#aa44ff"/>
    <rect x="12" y="3" width="6" height="4" fill="#88ffff"/>
    <rect x="9" y="12" width="2" height="4" fill="#007766"/>
    <rect x="14" y="12" width="2" height="4" fill="#007766"/>
    <rect x="19" y="12" width="2" height="4" fill="#007766"/>
    <rect x="12" y="0" width="2" height="3" fill="#ff44aa"/>
    <rect x="16" y="15" width="2" height="3" fill="#ff44aa"/>
  </svg>`;
}

function enemyDropperSvg() {
  return `<svg viewBox="0 0 22 22" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
    <rect x="7" y="7" width="8" height="8" fill="#ff6600"/>
    <rect x="9" y="2" width="4" height="5" fill="#ff4400"/>
    <rect x="9" y="15" width="4" height="5" fill="#ff4400"/>
    <rect x="2" y="9" width="5" height="4" fill="#ff4400"/>
    <rect x="15" y="9" width="5" height="4" fill="#ff4400"/>
    <rect x="9" y="9" width="2" height="2" fill="#ffff00"/>
    <rect x="11" y="9" width="2" height="2" fill="#ffff00"/>
  </svg>`;
}

// ── Enemy row helper ──────────────────────────────────────────────────────────

function enemyRow(svgHtml, nameRu, nameEn, descRu, descEn) {
  return `<div class="lg-enemy-row">
    <div class="lg-enemy-icon">${svgHtml}</div>
    <div class="lg-enemy-desc">
      <span class="lg-enemy-name" data-ru="${nameRu}" data-en="${nameEn}">${nameRu}</span>
      <span class="lg-enemy-note" data-ru="${descRu}" data-en="${descEn}">${descRu}</span>
    </div>
  </div>`;
}

export class LegendUI {
  constructor(el, { onClose } = {}) {
    this.el = el;
    this._onClose = onClose;
    this._render();
  }

  _render() {
    const ru = getLang() !== 'en';
    const closeBtn = this._onClose
      ? `<button class="panel-close-btn panel-close-btn--left" title="Скрыть" aria-label="Скрыть панель">
           <svg viewBox="0 0 7 12" width="7" height="12" fill="currentColor" aria-hidden="true">
             <polygon points="7,0 0,6 7,12"/>
           </svg>
         </button>`
      : '';
    this.el.innerHTML = `
      <div class="side-panel-inner">
        <div class="side-panel-header">
          <span class="side-panel-badge">📖</span>
          <span class="side-panel-title" data-ru="КАК ИГРАТЬ" data-en="HOW TO PLAY">КАК ИГРАТЬ</span>
          ${closeBtn}
        </div>

        ${section('УПРАВЛЕНИЕ', 'CONTROLS', `
          ${controlRow(['←', 'A'], 'влево', 'left')}
          ${controlRow(['→', 'D'], 'вправо', 'right')}
          ${controlRow(['SPACE'], 'выстрел', 'shoot')}
          ${controlRow(['ESC'], 'пауза', 'pause')}
          <div class="lg-mobile-hint" data-ru="📱 тап = выстрел · свайп = движение" data-en="📱 tap = shoot · drag = move">
            📱 тап = выстрел · свайп = движение
          </div>
        `)}

        ${section('ПЕРСОНАЖИ', 'CHARACTERS', `
          <div class="lg-skins">
            ${SKINS.map((svg, i) => {
              const names = [['ГЕРОЙ','HERO'],['РОБОТ','ROBOT'],['МАГ','WIZARD']];
              return `<div class="lg-skin-card">
                <div class="lg-skin-icon">${svg}</div>
                <div class="lg-skin-label" data-ru="${names[i][0]}" data-en="${names[i][1]}">${names[i][0]}</div>
              </div>`;
            }).join('')}
          </div>
        `)}

        ${section('ПЛАТФОРМЫ', 'PLATFORMS', `
          ${platRow(platNormal(), 'обычная',  'normal',   '')}
          ${platRow(platSuper(),  'супер',    'super',    '×2.5')}
          ${platRow(platFloat(),  'парящая',  'floating', '1×')}
        `)}

        ${section('ПРЕПЯТСТВИЯ', 'OBSTACLES', `
          ${platRow(platBarrier(), 'барьер', 'barrier', '🔫')}
        `)}

        ${section('ВРАГИ', 'ENEMIES', `
          <div class="lg-enemy-hint" data-ru="⚠ касание = -1 жизнь · 🔫 убить выстрелом" data-en="⚠ touch = -1 life · 🔫 shoot to kill">
            ⚠ касание = -1 жизнь · 🔫 убить выстрелом
          </div>
          ${enemyRow(enemyCrawlerSvg(), '🦀 КРАБ',    '🦀 CRAB',    'патрулирует платформы ←→',      'patrols platforms ←→')}
          ${enemyRow(enemyFlyerSvg(),   '🦇 ЛЕТУН',   '🦇 FLYER',   'летит через экран',              'flies across screen')}
          ${enemyRow(enemyShooterSvg(), '🛸 НЛО',     '🛸 UFO',     'стреляет снарядами ↑↓',         'fires projectiles ↑↓')}
          ${enemyRow(enemyDropperSvg(), '💀 ШИПАСТЫЙ','💀 DROPPER', 'падает сверху вниз',             'drops from above')}
        `)}

        ${section('БОНУСЫ', 'POWER-UPS', `
          <div class="lg-plat-row">
            <div class="lg-plat-icon lg-heart-icon">${heartSvg()}</div>
            <div class="lg-plat-desc">
              <span class="lg-plat-name" data-ru="+1 жизнь" data-en="+1 life">+1 жизнь</span>
              <span class="lg-plat-note" data-ru="5 сердец → сброс до 1" data-en="5 hearts → reset to 1">5 сердец → сброс до 1</span>
            </div>
          </div>
          <div class="lg-footer-note" data-ru="♥ появляется после 5000 очков" data-en="♥ appears after 5000 points">
            ♥ появляется после 5000 очков
          </div>
        `)}

        ${section('УРОВНИ', 'LEVELS', `
          <div class="lg-level-grid">
            ${[1,2,3,4,5,6,7,8,9,10].map(n => `
              <div class="lg-level-chip lg-level-chip--${n}">
                <span class="lg-level-num">${n}</span>
              </div>`).join('')}
          </div>
          <div class="lg-level-note" data-ru="сложность растёт каждые ~500-8000 очков · фон меняется" data-en="difficulty increases every ~500-8000 pts · background changes">
            сложность растёт · фон меняется
          </div>
        `)}
      </div>
    `;
  }

  updateLang() {
    const lang = getLang();
    this.el.querySelectorAll('[data-ru][data-en]').forEach(el => {
      el.textContent = lang === 'en' ? el.dataset.en : el.dataset.ru;
    });
    const tabText = this.el.closest('aside')?.querySelector('.panel-tab-text');
    if (tabText) tabText.textContent = lang === 'en' ? tabText.dataset.en : tabText.dataset.ru;
  }
}
