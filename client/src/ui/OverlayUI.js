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

// Pixel-art 32×32 SVG icons for each achievement
const _svg = (content, accent = '#ffdd00') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="40" height="40" style="image-rendering:pixelated">${content}</svg>`;

const ACH_ICONS = {
  // 🟢 FIRST_JUMP — doodler jumping
  FIRST_JUMP: _svg(`
    <rect x="12" y="2"  width="8"  height="8"  fill="#ffdd00"/>
    <rect x="10" y="10" width="12" height="10" fill="#ffdd00"/>
    <rect x="10" y="13" width="12" height="4"  fill="#ff006e"/>
    <rect x="14" y="11" width="4"  height="3"  fill="#00e5ff"/>
    <rect x="6"  y="22" width="4"  height="6"  fill="#ffdd00"/>
    <rect x="22" y="22" width="4"  height="6"  fill="#ffdd00"/>
    <rect x="8"  y="28" width="16" height="2"  fill="#00ff88" opacity="0.6"/>
    <rect x="10" y="30" width="12" height="2"  fill="#00ff88" opacity="0.3"/>
  `),
  // 🔴 FIRST_BLOOD — red bullet hitting enemy
  FIRST_BLOOD: _svg(`
    <rect x="14" y="2"  width="4"  height="10" fill="#ffdd00"/>
    <rect x="13" y="0"  width="6"  height="3"  fill="#ffdd00"/>
    <rect x="8"  y="14" width="16" height="10" fill="#ff2244"/>
    <rect x="6"  y="16" width="6"  height="6"  fill="#cc1122"/>
    <rect x="20" y="16" width="6"  height="6"  fill="#cc1122"/>
    <rect x="10" y="15" width="4"  height="4"  fill="#ffffff"/>
    <rect x="18" y="15" width="4"  height="4"  fill="#ffffff"/>
    <rect x="11" y="16" width="2"  height="2"  fill="#110000"/>
    <rect x="19" y="16" width="2"  height="2"  fill="#110000"/>
    <rect x="12" y="24" width="8"  height="4"  fill="#ff2244"/>
    <rect x="14" y="26" width="4"  height="6"  fill="#aa0022"/>
  `),
  // 🟠 HUNTER — crosshair with 50 bullets
  HUNTER: _svg(`
    <rect x="15" y="2"  width="2"  height="28" fill="#00e5ff" opacity="0.5"/>
    <rect x="2"  y="15" width="28" height="2"  fill="#00e5ff" opacity="0.5"/>
    <rect x="11" y="11" width="10" height="10" fill="none" stroke="#00e5ff" stroke-width="2"/>
    <rect x="14" y="14" width="4"  height="4"  fill="#ff006e"/>
    <rect x="15" y="15" width="2"  height="2"  fill="#ffffff"/>
    <rect x="2"  y="2"  width="4"  height="4"  fill="#00e5ff"/>
    <rect x="26" y="2"  width="4"  height="4"  fill="#00e5ff"/>
    <rect x="2"  y="26" width="4"  height="4"  fill="#00e5ff"/>
    <rect x="26" y="26" width="4"  height="4"  fill="#00e5ff"/>
  `),
  // 🔴 CRAWLER_SLAYER — red crab with X
  CRAWLER_SLAYER: _svg(`
    <rect x="6"  y="10" width="20" height="10" fill="#ff2244"/>
    <rect x="2"  y="12" width="6"  height="6"  fill="#cc1122"/>
    <rect x="24" y="12" width="6"  height="6"  fill="#cc1122"/>
    <rect x="8"  y="8"  width="4"  height="4"  fill="#ffffff"/>
    <rect x="20" y="8"  width="4"  height="4"  fill="#ffffff"/>
    <rect x="9"  y="9"  width="2"  height="2"  fill="#110000"/>
    <rect x="21" y="9"  width="2"  height="2"  fill="#110000"/>
    <rect x="10" y="20" width="4"  height="4"  fill="#aa0022"/>
    <rect x="18" y="20" width="4"  height="4"  fill="#aa0022"/>
    <rect x="6"  y="4"  width="4"  height="4"  fill="#ffdd00"/>
    <rect x="22" y="4"  width="4"  height="4"  fill="#ffdd00"/>
    <rect x="4"  y="6"  width="4"  height="2"  fill="#ffdd00"/>
    <rect x="24" y="6"  width="4"  height="2"  fill="#ffdd00"/>
  `),
  // 🔵 VETERAN — shield with star
  VETERAN: _svg(`
    <rect x="8"  y="2"  width="16" height="4"  fill="#6677aa"/>
    <rect x="4"  y="6"  width="24" height="18" fill="#6677aa"/>
    <rect x="6"  y="24" width="20" height="4"  fill="#6677aa"/>
    <rect x="10" y="28" width="12" height="2"  fill="#6677aa"/>
    <rect x="13" y="30" width="6"  height="2"  fill="#6677aa"/>
    <rect x="14" y="10" width="4"  height="10" fill="#ffdd00"/>
    <rect x="10" y="14" width="12" height="4"  fill="#ffdd00"/>
    <rect x="12" y="11" width="8"  height="2"  fill="#ffdd00"/>
    <rect x="12" y="19" width="8"  height="2"  fill="#ffdd00"/>
  `),
  // 🟣 SURVIVOR — lightning bolt at level 7
  SURVIVOR: _svg(`
    <rect x="16" y="2"  width="8"  height="12" fill="#ffdd00"/>
    <rect x="10" y="14" width="12" height="10" fill="#ffdd00"/>
    <rect x="8"  y="18" width="14" height="12" fill="#ffdd00"/>
    <rect x="16" y="2"  width="2"  height="14" fill="#ffffff" opacity="0.4"/>
    <rect x="2"  y="26" width="6"  height="4"  fill="#00e5ff" opacity="0.6"/>
    <rect x="24" y="26" width="6"  height="4"  fill="#00e5ff" opacity="0.6"/>
  `),
  // 🟦 SNIPER — UFO/shooter with target
  SNIPER: _svg(`
    <rect x="6"  y="14" width="20" height="4"  fill="#00ccbb"/>
    <rect x="10" y="10" width="12" height="8"  fill="#aa44ff"/>
    <rect x="13" y="8"  width="6"  height="4"  fill="#88ffff"/>
    <rect x="8"  y="16" width="2"  height="4"  fill="#007766"/>
    <rect x="15" y="16" width="2"  height="4"  fill="#007766"/>
    <rect x="22" y="16" width="2"  height="4"  fill="#007766"/>
    <rect x="14" y="22" width="4"  height="8"  fill="#ffdd00"/>
    <rect x="12" y="28" width="8"  height="2"  fill="#ff006e"/>
    <rect x="4"  y="12" width="24" height="2"  fill="#00ffee" opacity="0.5"/>
  `),
  // 🟠 GHOST_HUNTER — orange spike ball dropper
  GHOST_HUNTER: _svg(`
    <rect x="10" y="10" width="12" height="12" fill="#ff6600"/>
    <rect x="6"  y="14" width="4"  height="4"  fill="#ff4400"/>
    <rect x="22" y="14" width="4"  height="4"  fill="#ff4400"/>
    <rect x="14" y="6"  width="4"  height="4"  fill="#ff4400"/>
    <rect x="14" y="22" width="4"  height="4"  fill="#ff4400"/>
    <rect x="8"  y="8"  width="4"  height="4"  fill="#dd3300"/>
    <rect x="20" y="8"  width="4"  height="4"  fill="#dd3300"/>
    <rect x="8"  y="20" width="4"  height="4"  fill="#dd3300"/>
    <rect x="20" y="20" width="4"  height="4"  fill="#dd3300"/>
    <rect x="13" y="12" width="3"  height="3"  fill="#ffff00"/>
    <rect x="17" y="12" width="3"  height="3"  fill="#ffff00"/>
    <rect x="14" y="16" width="4"  height="2"  fill="#ffffff"/>
  `),
  // 🟥 WALL_BREAKER — breaking wall / barrier cubes
  WALL_BREAKER: _svg(`
    <rect x="2"  y="12" width="28" height="8"  fill="#ff2244"/>
    <rect x="2"  y="12" width="6"  height="8"  fill="#cc1122"/>
    <rect x="10" y="12" width="6"  height="8"  fill="#cc1122"/>
    <rect x="18" y="12" width="6"  height="8"  fill="#cc1122"/>
    <rect x="2"  y="12" width="28" height="1"  fill="#ff6677" opacity="0.5"/>
    <rect x="2"  y="19" width="28" height="1"  fill="#991122" opacity="0.5"/>
    <rect x="10" y="4"  width="4"  height="4"  fill="#ffdd00" opacity="0.8"/>
    <rect x="18" y="2"  width="4"  height="6"  fill="#ffdd00" opacity="0.6"/>
    <rect x="8"  y="22" width="6"  height="6"  fill="#ff8800" opacity="0.7"/>
    <rect x="20" y="24" width="4"  height="4"  fill="#ff8800" opacity="0.5"/>
    <rect x="14" y="8"  width="6"  height="4"  fill="#ffffff" opacity="0.4"/>
  `),
  // 🌟 LEGEND — star / trophy
  LEGEND: _svg(`
    <rect x="14" y="2"  width="4"  height="8"  fill="#ffdd00"/>
    <rect x="10" y="6"  width="12" height="4"  fill="#ffdd00"/>
    <rect x="8"  y="10" width="16" height="14" fill="#ffdd00"/>
    <rect x="10" y="24" width="12" height="4"  fill="#ffdd00"/>
    <rect x="8"  y="28" width="16" height="2"  fill="#ffaa00"/>
    <rect x="6"  y="30" width="20" height="2"  fill="#ffaa00"/>
    <rect x="14" y="4"  width="2"  height="4"  fill="#ffffff" opacity="0.5"/>
    <rect x="14" y="12" width="4"  height="6"  fill="#ff8800"/>
    <rect x="12" y="14" width="8"  height="4"  fill="#ff8800"/>
    <rect x="2"  y="10" width="6"  height="4"  fill="#ffdd00"/>
    <rect x="24" y="10" width="6"  height="4"  fill="#ffdd00"/>
    <rect x="2"  y="16" width="8"  height="4"  fill="#ffdd00"/>
    <rect x="22" y="16" width="8"  height="4"  fill="#ffdd00"/>
  `),
  DEFAULT: _svg(`<rect x="8" y="8" width="16" height="16" fill="#ffdd00"/>`),
};

export class OverlayUI {
  constructor(root, callbacks) {
    this.root = root;
    this.callbacks = callbacks;
  }

  _btn(action, icon, labelKey, type = 'button', extraClass = '') {
    const cls = extraClass ? ` class="${extraClass}"` : '';
    return `<button data-action="${action}" type="${type}"${cls}>
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
          ${this._btn('start',        '🎮', 'menu_start')}
          ${this._btn('scores',       '🏆', 'menu_scores')}
          ${this._btn('achievements', '🏅', 'menu_achievements')}
          ${this._btn('settings',     '⚙️', 'menu_settings')}
          ${this._btn('logout',       '🚪', 'auth_logout', 'button', 'btn--danger')}
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

  showSettings(playerName, currentSkin = 0, currentLang = 'ru', errorMsg = '') {
    const skinCards = SKIN_PREVIEWS.map((svg, i) => `
      <div class="skin-card ${i === currentSkin ? 'selected' : ''}" data-skin="${i}">
        <div class="skin-preview">${svg}</div>
        <span class="skin-name">${t(`skin_${i}`)}</span>
      </div>
    `).join('');

    const error = errorMsg
      ? `<p class="auth-error">⚠ ${this.escapeHtml(errorMsg)}</p>`
      : '';

    this.root.innerHTML = `
      <div class="panel">
        <h2>${t('settings_title')}</h2>
        ${error}
        <form id="settings-form">
          <label class="field-label" for="username-input">${t('settings_name')}</label>
          <input id="username-input" class="field-input" type="text" maxlength="20"
            value="${this.escapeHtml(playerName)}" autocomplete="off" spellcheck="false"/>
          <p class="field-hint">${t('auth_username_hint')}</p>

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

  showAuthLoading() {
    this.root.innerHTML = `
      <div class="panel">
        <p class="auth-loading">${t('auth_loading')}</p>
      </div>
    `;
  }

  showAuth(activeTab = 'login', errorMsg = '') {
    this._authTab = activeTab;
    const isLogin = activeTab === 'login';
    const error = errorMsg
      ? `<p class="auth-error">⚠ ${this.escapeHtml(errorMsg)}</p>`
      : '';

    this.root.innerHTML = `
      <div class="panel panel--auth">
        <h1>${t('title').replace('\n', '<br>')}</h1>
        <p class="panel-subtitle">${t('subtitle')}</p>

        <div class="auth-tabs">
          <button class="auth-tab ${isLogin ? 'active' : ''}" data-tab="login">${t('auth_login_tab')}</button>
          <button class="auth-tab ${!isLogin ? 'active' : ''}" data-tab="register">${t('auth_reg_tab')}</button>
        </div>

        ${error}

        ${isLogin ? `
          <form id="auth-form" class="auth-form">
            <label class="field-label">${t('auth_username')}</label>
            <input class="field-input" type="text" id="auth-username" maxlength="20" autocomplete="username" required/>

            <label class="field-label">${t('auth_password')}</label>
            <input class="field-input" type="password" id="auth-password" autocomplete="current-password" required/>

            <div class="actions">
              <button type="submit" data-action="login">
                <span class="btn-icon">🔑</span>
                <span class="btn-text">${t('auth_login_btn')}</span>
              </button>
            </div>
            <p class="hint">${t('auth_hint_login')}</p>
          </form>
        ` : `
          <form id="auth-form" class="auth-form">
            <label class="field-label">${t('auth_username')}</label>
            <input class="field-input" type="text" id="auth-username" maxlength="20" autocomplete="username" required/>
            <p class="field-hint">${t('auth_username_hint')}</p>

            <label class="field-label">${t('auth_email')}</label>
            <input class="field-input" type="email" id="auth-email" autocomplete="email" required/>

            <label class="field-label">${t('auth_password')}</label>
            <input class="field-input" type="password" id="auth-password" autocomplete="new-password" required/>
            <p class="field-hint">${t('auth_pass_hint')}</p>

            <div class="actions">
              <button type="submit" data-action="register">
                <span class="btn-icon">🚀</span>
                <span class="btn-text">${t('auth_reg_btn')}</span>
              </button>
            </div>
            <p class="hint">${t('auth_hint_reg')}</p>
          </form>
        `}
      </div>
    `;
    this._bindAuthTabs();
    this._bindAuthForm(isLogin);
  }

  showAchievements(achievements, lang = 'ru') {
    const isEn = lang === 'en';
    const cards = achievements.length
      ? achievements.map(a => {
          const name = isEn ? a.nameEn : a.nameRu;
          const desc = isEn ? a.descEn : a.descRu;
          const icon = ACH_ICONS[a.code] ?? ACH_ICONS.DEFAULT;
          const cls  = a.unlocked ? 'ach-card ach-card--unlocked' : 'ach-card ach-card--locked';
          const pts  = isEn ? `${a.points} pts` : `${a.points} оч.`;
          return `
            <div class="${cls}">
              <div class="ach-icon">${icon}</div>
              <div class="ach-info">
                <div class="ach-name">${this.escapeHtml(name)}</div>
                <div class="ach-desc">${this.escapeHtml(desc)}</div>
                <div class="ach-pts">${pts}</div>
              </div>
            </div>`;
        }).join('')
      : `<p class="scores-empty">${t('achievements_empty')}</p>`;

    this.root.innerHTML = `
      <div class="panel panel--achievements">
        <h2>${t('achievements_title')}</h2>
        <div class="ach-grid">${cards}</div>
        <div class="actions">
          ${this._btn('back', '◀️', 'back')}
        </div>
      </div>
    `;
    this.bindButtons();
  }

  showAchievementToast(achievement, lang = 'ru') {
    const isEn = lang === 'en';
    const name = isEn ? achievement.nameEn : achievement.nameRu;
    const icon = ACH_ICONS[achievement.code] ?? ACH_ICONS.DEFAULT;
    const label = isEn ? 'ACHIEVEMENT UNLOCKED' : 'ДОСТИЖЕНИЕ ПОЛУЧЕНО';

    const toast = document.createElement('div');
    toast.className = 'ach-toast';
    toast.innerHTML = `
      <div class="ach-toast-icon">${icon}</div>
      <div class="ach-toast-text">
        <div class="ach-toast-label">${label}</div>
        <div class="ach-toast-name">${this.escapeHtml(name)}</div>
      </div>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('ach-toast--visible'));
    setTimeout(() => {
      toast.classList.remove('ach-toast--visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3000);
  }

  showAuthError(msg) {
    this.showAuth(this._authTab || 'login', msg);
  }

  _bindAuthTabs() {
    this.root.querySelectorAll('.auth-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this.showAuth(tab.dataset.tab);
      });
    });
  }

  _bindAuthForm(isLogin) {
    const form = this.root.querySelector('#auth-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = this.root.querySelector('#auth-username')?.value.trim();
      const password = this.root.querySelector('#auth-password')?.value;
      if (isLogin) {
        this.callbacks.login?.(username, password);
      } else {
        const email = this.root.querySelector('#auth-email')?.value.trim();
        this.callbacks.register?.(username, email, password);
      }
    });
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
          const nameInput = this.root.querySelector('#username-input');
          const skinInput = this.root.querySelector('#skin-input');
          const langInput = this.root.querySelector('#lang-input');
          this.callbacks[action](
            nameInput ? nameInput.value.trim() : '',
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
        const nameInput = this.root.querySelector('#username-input');
        const skinInput = this.root.querySelector('#skin-input');
        const langInput = this.root.querySelector('#lang-input');
        this.callbacks['save-settings'](
          nameInput ? nameInput.value.trim() : '',
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
