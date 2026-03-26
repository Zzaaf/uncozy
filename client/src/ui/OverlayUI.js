export class OverlayUI {
  constructor(root, callbacks) {
    this.root = root;
    this.callbacks = callbacks;
  }

  showMenu(playerName) {
    this.root.innerHTML = `
      <div class="panel">
        <h1>Doodle Jump</h1>
        <p class="player-name">Player: <b>${this.escapeHtml(playerName)}</b></p>
        <div class="actions">
          <button data-action="start">Start</button>
          <button data-action="scores">Scores</button>
          <button data-action="settings">Settings</button>
          <button data-action="exit">Exit</button>
        </div>
        <p class="hint">Управление: A/D, <-/->, мышь или тач.</p>
      </div>
    `;
    this.bindButtons();
  }

  showScores(scores) {
    const items = scores.length
      ? scores
          .map(
            (entry, index) =>
              `<li>#${index + 1} — ${this.escapeHtml(entry.name)}: ${entry.score}</li>`,
          )
          .join('')
      : '<li>Пока нет результатов</li>';

    this.root.innerHTML = `
      <div class="panel">
        <h2>Scores</h2>
        <ol class="score-list">${items}</ol>
        <div class="actions">
          <button data-action="back">Back</button>
        </div>
      </div>
    `;
    this.bindButtons();
  }

  showSettings(playerName) {
    this.root.innerHTML = `
      <div class="panel">
        <h2>Settings</h2>
        <form id="settings-form">
          <label class="field-label" for="player-name-input">Имя игрока</label>
          <input id="player-name-input" class="field-input" type="text" maxlength="24" value="${this.escapeHtml(playerName)}" />
          <div class="actions">
            <button data-action="save-settings" type="submit">Save</button>
            <button data-action="back" type="button">Back</button>
          </div>
        </form>
      </div>
    `;
    this.bindButtons();
  }

  showGameOver(score) {
    this.root.innerHTML = `
      <div class="panel">
        <h2>Game Over</h2>
        <p class="result">Ваш результат: <b>${score}</b></p>
        <div class="actions">
          <button data-action="restart">Start</button>
          <button data-action="scores">Scores</button>
          <button data-action="back">Menu</button>
        </div>
      </div>
    `;
    this.bindButtons();
  }

  hide() {
    this.root.innerHTML = '';
  }

  bindButtons() {
    this.root.querySelectorAll('button[data-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        if (this.callbacks[action]) {
          if (action === 'save-settings') {
            const input = this.root.querySelector('#player-name-input');
            this.callbacks[action](input ? input.value : '');
            return;
          }
          this.callbacks[action]();
        }
      });
    });

    const form = this.root.querySelector('#settings-form');
    if (form && this.callbacks['save-settings']) {
      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const input = this.root.querySelector('#player-name-input');
        this.callbacks['save-settings'](input ? input.value : '');
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
