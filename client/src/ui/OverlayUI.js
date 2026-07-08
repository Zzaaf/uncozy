import { t } from '../i18n.js';

const SKIN_PREVIEWS = [
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
    <rect x="11" y="0" width="2" height="4" fill="#00ff88"/>
    <rect x="9"  y="0" width="6" height="2" fill="#00ff88"/>
    <rect x="3"  y="4" width="18" height="14" fill="#8899aa"/>
    <rect x="5"  y="8" width="14" height="6"  fill="#ff2200"/>
    <rect x="9"  y="9" width="6"  height="4"  fill="#ff6644"/>
    <rect x="1"  y="18" width="22" height="14" fill="#6677aa"/>
    <rect x="5"  y="20" width="14" height="8"  fill="#222244"/>
    <rect x="7"  y="22" width="3"  height="2"  fill="#00ff88"/>
    <rect x="14" y="22" width="3"  height="2"  fill="#ff2200"/>
    <rect x="0"  y="19" width="1"  height="10" fill="#8899aa"/>
    <rect x="23" y="19" width="1"  height="10" fill="#8899aa"/>
    <rect x="4"  y="32" width="6"  height="6"  fill="#8899aa"/>
    <rect x="14" y="32" width="6"  height="6"  fill="#8899aa"/>
  </svg>`,
  `<svg viewBox="0 0 24 42" xmlns="http://www.w3.org/2000/svg">
    <rect x="8"  y="0"  width="8"  height="8"  fill="#8800cc"/>
    <rect x="10" y="0"  width="4"  height="3"  fill="#aa00ff"/>
    <rect x="11" y="1"  width="2"  height="2"  fill="#ffdd00"/>
    <rect x="1"  y="8"  width="22" height="3"  fill="#ffdd00"/>
    <rect x="5"  y="11" width="14" height="10" fill="#ffccaa"/>
    <rect x="7"  y="14" width="4"  height="4"  fill="#9900ff"/>
    <rect x="13" y="14" width="4"  height="4"  fill="#9900ff"/>
    <rect x="0"  y="21" width="24" height="18" fill="#6600aa"/>
    <rect x="2"  y="28" width="20" height="2"  fill="#ffdd00"/>
    <rect x="10" y="23" width="4"  height="4"  fill="#ffdd00"/>
  </svg>`,
];

export class OverlayUI {
  constructor(root, callbacks) {
    this.root = root;
    this.callbacks = callbacks;
  }

  _btn(action, icon, labelKey, type = 'button') {
    return `<button data-action="${action}" type="${type}">
      <span class="btn-icon">${icon}</span>
      <span class="btn-text">${t(labelKey)}</span>
    </button>`;
  }

  showMenu(playerName) {
    this.root.innerHTML = `
      <div class="panel">
        <h1>${t('title').replace('\n', '<br>')}</h1>
        <p class="panel-subtitle">${t('subtitle')}</p>
        <p class="player-name">${t('player_prefix')} ${this.escapeHtml(playerName)} ${t('player_suffix')}</p>
        <div class="actions">
          ${this._btn('start',    '🎮', 'menu_start')}
          ${this._btn('scores',   '🏆', 'menu_scores')}
          ${this._btn('settings', '⚙️', 'menu_settings')}
          ${this._btn('exit',     '🚪', 'menu_exit')}
        </div>
        <p class="hint">${t('menu_hint')}</p>
      </div>
    `;
    this.bindButtons();
  }

  showPause(playerName) {
    this.root.innerHTML = `
      <div class="panel">
        <h1>${t('pause_title')}</h1>
        <p class="player-name">${t('player_prefix')} ${this.escapeHtml(playerName)} ${t('player_suffix')}</p>
        <div class="actions">
          ${this._btn('resume',          '▶️',  'pause_resume')}
          ${this._btn('scores',          '🏆', 'menu_scores')}
          ${this._btn('settings',        '⚙️', 'menu_settings')}
          ${this._btn('restart-confirm', '🔄', 'pause_restart')}
        </div>
        <p class="hint">${t('pause_hint')}</p>
      </div>
    `;
    this.bindButtons();
  }

  showRestartConfirm() {
    this.root.innerHTML = `
      <div class="panel">
        <h2>${t('confirm_title')}</h2>
        <p class="confirm-text">${t('confirm_msg')}</p>
        <div class="actions">
          ${this._btn('confirm-restart', '✅', 'confirm_yes')}
          ${this._btn('cancel-restart',  '❌', 'confirm_no')}
        </div>
      </div>
    `;
    this.bindButtons();
  }

  showScores(scores) {
    const medals = ['🥇', '🥈', '🥉'];
    const items = scores.length
      ? scores.map((e, i) =>
          `<li>${medals[i] ?? `#${i + 1}`} ${this.escapeHtml(e.name)}: ${e.score}</li>`
        ).join('')
      : `<li>${t('scores_empty')}</li>`;

    this.root.innerHTML = `
      <div class="panel">
        <h2>${t('scores_title')}</h2>
        <ol class="score-list">${items}</ol>
        <div class="actions">
          ${this._btn('back', '◀️', 'back')}
        </div>
      </div>
    `;
    this.bindButtons();
  }

  showSettings(playerName, currentSkin = 0, currentLang = 'ru') {
    const skinCards = SKIN_PREVIEWS.map((svg, i) => `
      <div class="skin-card ${i === currentSkin ? 'selected' : ''}" data-skin="${i}">
        <div class="skin-preview">${svg}</div>
        <span class="skin-name">${t(`skin_${i}`)}</span>
      </div>
    `).join('');

    this.root.innerHTML = `
      <div class="panel">
        <h2>${t('settings_title')}</h2>
        <form id="settings-form">
          <label class="field-label" for="player-name-input">${t('settings_name')}</label>
          <input id="player-name-input" class="field-input" type="text" maxlength="24"
            value="${this.escapeHtml(playerName)}" autocomplete="off" spellcheck="false"/>

          <label class="field-label">${t('settings_char')}</label>
          <div class="skin-picker">${skinCards}</div>
          <input type="hidden" id="skin-input" value="${currentSkin}"/>

          <label class="field-label">${t('settings_lang')}</label>
          <div class="lang-picker">
            <div class="lang-card ${currentLang === 'ru' ? 'selected' : ''}" data-lang="ru">${t('lang_ru')}</div>
            <div class="lang-card ${currentLang === 'en' ? 'selected' : ''}" data-lang="en">${t('lang_en')}</div>
          </div>
          <input type="hidden" id="lang-input" value="${currentLang}"/>

          <div class="actions">
            ${this._btn('save-settings', '💾', 'settings_save', 'submit')}
            ${this._btn('back',          '◀️', 'back')}
          </div>
        </form>
      </div>
    `;
    this.bindButtons();
  }

  showGameOver(score) {
    this.root.innerHTML = `
      <div class="panel">
        <h2>${t('gameover_title')}</h2>
        <p class="result">${t('gameover_score')}<b>${score}</b></p>
        <div class="actions">
          ${this._btn('restart', '🔄', 'gameover_restart')}
          ${this._btn('scores',  '🏆', 'gameover_scores')}
          ${this._btn('back',    '🏠', 'gameover_menu')}
        </div>
      </div>
    `;
    this.bindButtons();
  }

  hide() {
    this.root.innerHTML = '';
  }

  bindButtons() {
    this.root.querySelectorAll('button[data-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (!this.callbacks[action]) return;

        if (action === 'save-settings') {
          const nameInput = this.root.querySelector('#player-name-input');
          const skinInput = this.root.querySelector('#skin-input');
          const langInput = this.root.querySelector('#lang-input');
          this.callbacks[action](
            nameInput ? nameInput.value : '',
            skinInput ? Number(skinInput.value) : 0,
            langInput ? langInput.value : 'ru',
          );
          return;
        }
        this.callbacks[action]();
      });
    });

    // Skin card selection
    this.root.querySelectorAll('.skin-card').forEach((card) => {
      card.addEventListener('click', () => {
        this.root.querySelectorAll('.skin-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        const input = this.root.querySelector('#skin-input');
        if (input) input.value = card.dataset.skin;
      });
    });

    // Language card selection
    this.root.querySelectorAll('.lang-card').forEach((card) => {
      card.addEventListener('click', () => {
        this.root.querySelectorAll('.lang-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        const input = this.root.querySelector('#lang-input');
        if (input) input.value = card.dataset.lang;
      });
    });

    // Form submit
    const form = this.root.querySelector('#settings-form');
    if (form && this.callbacks['save-settings']) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = this.root.querySelector('#player-name-input');
        const skinInput = this.root.querySelector('#skin-input');
        const langInput = this.root.querySelector('#lang-input');
        this.callbacks['save-settings'](
          nameInput ? nameInput.value : '',
          skinInput ? Number(skinInput.value) : 0,
          langInput ? langInput.value : 'ru',
        );
      });
    }
  }

  escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
