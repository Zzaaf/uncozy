import { AuthApi } from '../api/AuthApi.js';
import { getLang } from '../i18n.js';

const MEDALS = ['🥇', '🥈', '🥉'];

export class LeaderboardUI {
  constructor(el, { onClose } = {}) {
    this.el = el;
    this._onClose    = onClose;
    this._data       = null;
    this._liveScore  = 0;
    this._liveActive = false;
    this._onlineIds  = new Set();
    this._renderSkeleton();
  }

  setOnline(users) {
    this._onlineIds = new Set((users ?? []).map(u => u.id));
    if (this._data) this._renderData(this._data);
  }

  _closeBtnHtml() {
    if (!this._onClose) return '';
    return `<button class="panel-close-btn panel-close-btn--right" title="Скрыть" aria-label="Скрыть панель">
      <svg viewBox="0 0 7 12" width="7" height="12" fill="currentColor" aria-hidden="true">
        <polygon points="0,0 7,6 0,12"/>
      </svg>
    </button>`;
  }

  _attachClose() {
    if (!this._onClose) return;
    const btn = this.el.querySelector('.panel-close-btn');
    if (btn) btn.addEventListener('click', this._onClose);
  }

  start() {
    this._fetch();
  }

  stop() {
    this._liveActive = false;
    this._liveScore = 0;
    this._renderSkeleton();
  }

  setLiveScore(score, active = true) {
    this._liveScore  = Math.floor(score);
    this._liveActive = active;
    this._updateLiveBadge();
  }

  refresh() {
    this._fetch();
  }

  updateLang() {
    if (this._data) this._renderData(this._data);
    else this._renderSkeleton();
    const tabText = this.el.closest('aside')?.querySelector('.panel-tab-text');
    if (tabText) tabText.textContent = getLang() === 'en' ? tabText.dataset.en : tabText.dataset.ru;
  }

  // ── Private ──────────────────────────────────

  _getMyHighScore() {
    if (this._data) {
      if (this._data.myEntry) return this._data.myEntry.highScore;
      const me = this._data.entries?.find(e => e.isMe);
      if (me) return me.highScore;
    }
    return AuthApi.getUser()?.highScore ?? 0;
  }

  _getServerRecord() {
    const top = this._data?.entries;
    return (top && top.length > 0) ? top[0].highScore : 0;
  }

  // Computes what the live panel should display
  _computePhase() {
    const ru       = getLang() !== 'en';
    const score    = this._liveScore;
    const myHS     = this._getMyHighScore();
    const serverHS = this._getServerRecord();

    if (!this._liveActive) {
      return {
        label:     ru ? 'ДО ЛИЧНОГО РЕКОРДА' : 'TO PERSONAL RECORD',
        sublabel:  null,
        value:     '—',
        labelGold: false,
        valueGold: false,
      };
    }

    const personalBeaten = score >= myHS && (myHS > 0 || score > 0);
    const serverBeaten   = serverHS > 0 && score >= serverHS;
    const noServerRecord = serverHS === 0;

    // Phase 1 — personal not beaten yet
    if (!personalBeaten) {
      return {
        label:     ru ? 'ДО ЛИЧНОГО РЕКОРДА' : 'TO PERSONAL RECORD',
        sublabel:  null,
        value:     (myHS - score).toLocaleString(),
        labelGold: false,
        valueGold: false,
      };
    }

    // Phase 3 — server record beaten (or no server record, so personal = global)
    if (serverBeaten || noServerRecord) {
      return {
        label:     ru ? '🏆 РЕКОРД СЕРВЕРА ПОБИТ!' : '🏆 SERVER RECORD!',
        sublabel:  null,
        value:     score.toLocaleString(),
        labelGold: true,
        valueGold: true,
      };
    }

    // Phase 2 — personal beaten, server record still ahead
    return {
      label:     ru ? '🏆 ЛИЧНЫЙ РЕКОРД ПОБИТ!' : '🏆 PERSONAL RECORD!',
      sublabel:  ru ? 'ДО РЕКОРДА СЕРВЕРА'       : 'TO SERVER RECORD',
      value:     (serverHS - score).toLocaleString(),
      labelGold: true,   // celebrate personal record in gold
      valueGold: false,  // but counter to server record is white
    };
  }

  _updateLiveBadge() {
    const panel = this.el.querySelector('.lb-live-panel');
    if (!panel) return;

    const { label, sublabel, value, labelGold, valueGold } = this._computePhase();

    const labelEl    = panel.querySelector('.lb-live-label');
    const sublabelEl = panel.querySelector('.lb-live-sublabel');
    const scoreEl    = panel.querySelector('.lb-live-score');

    if (labelEl) {
      labelEl.textContent = label;
      labelEl.classList.toggle('lb-live-label--gold', labelGold);
    }

    if (sublabelEl) {
      sublabelEl.textContent = sublabel ?? '';
      sublabelEl.style.display = sublabel ? '' : 'none';
    }

    if (scoreEl) {
      scoreEl.textContent = value;
      scoreEl.className = [
        'lb-live-score',
        this._liveActive ? 'lb-live-score--active' : '',
        valueGold        ? 'lb-live-score--beaten'  : '',
      ].filter(Boolean).join(' ');
    }
  }

  async _fetch() {
    const data = await AuthApi.getLeaderboard();
    if (!data) return;
    this._data = data;
    this._renderData(data);
  }

  _renderSkeleton() {
    const ru = getLang() !== 'en';
    this.el.innerHTML = `
      <div class="side-panel-inner">
        <div class="side-panel-header">
          <span class="side-panel-badge">🏆</span>
          <span class="side-panel-title">${ru ? 'ЛИДЕРЫ' : 'LEADERBOARD'}</span>
          ${this._closeBtnHtml()}
        </div>
        <div class="lb-empty">${ru ? 'ЗАГРУЗКА...' : 'LOADING...'}</div>
      </div>
    `;
    this._attachClose();
  }

  _renderData({ entries, myEntry }) {
    const ru = getLang() !== 'en';
    const { label, sublabel, value, labelGold, valueGold } = this._computePhase();

    const rows = (entries ?? []).map(e => {
      const medal = e.rank <= 3
        ? `<span class="lb-medal">${MEDALS[e.rank - 1]}</span>`
        : `<span class="lb-rank">#${e.rank}</span>`;
      const isOnline = e.publicId && this._onlineIds.has(e.publicId);
      const onlineDot = isOnline ? ' <span class="lb-online" title="online">●</span>' : '';
      return `
        <div class="lb-row${e.isMe ? ' lb-row--me' : ''}">
          <div class="lb-rank-cell">${medal}</div>
          <div class="lb-name">${escHtml(e.username)}${e.isMe ? ' <span class="lb-you">●</span>' : onlineDot}</div>
          <div class="lb-score">${e.highScore.toLocaleString()}</div>
        </div>`;
    }).join('');

    const noEntries = !entries?.length
      ? `<div class="lb-empty">${ru ? 'Пока нет результатов' : 'No scores yet'}</div>`
      : '';

    const myOnlineDot = myEntry?.publicId && this._onlineIds.has(myEntry.publicId)
      ? ' <span class="lb-online" title="online">●</span>' : '';
    const myEntryHtml = myEntry ? `
      <div class="lb-separator"></div>
      <div class="lb-row lb-row--me lb-row--outside">
        <div class="lb-rank-cell"><span class="lb-rank">#${myEntry.rank}</span></div>
        <div class="lb-name">${escHtml(myEntry.username)} <span class="lb-you">●</span>${myOnlineDot}</div>
        <div class="lb-score">${myEntry.highScore.toLocaleString()}</div>
      </div>` : '';

    const scoreClass = [
      'lb-live-score',
      this._liveActive ? 'lb-live-score--active' : '',
      valueGold        ? 'lb-live-score--beaten'  : '',
    ].filter(Boolean).join(' ');

    this.el.innerHTML = `
      <div class="side-panel-inner">
        <div class="side-panel-header">
          <span class="side-panel-badge">🏆</span>
          <span class="side-panel-title">${ru ? 'ЛИДЕРЫ' : 'LEADERBOARD'}</span>
          ${this._closeBtnHtml()}
        </div>

        <div class="lb-header-row">
          <div class="lb-rank-cell">${ru ? 'МЕСТО' : 'RANK'}</div>
          <div class="lb-name">${ru ? 'ИГРОК' : 'PLAYER'}</div>
          <div class="lb-score">${ru ? 'РЕКОРД' : 'BEST'}</div>
        </div>

        <div class="lb-list">
          ${noEntries}
          ${rows}
          ${myEntryHtml}
        </div>

        <div class="lb-live-panel">
          <div class="lb-live-label${labelGold ? ' lb-live-label--gold' : ''}">${label}</div>
          <div class="lb-live-sublabel"${sublabel ? '' : ' style="display:none"'}>${sublabel ?? ''}</div>
          <div class="${scoreClass}">${value}</div>
        </div>
      </div>
    `;
    this._attachClose();
  }
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
