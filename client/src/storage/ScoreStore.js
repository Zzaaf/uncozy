import {
  DEFAULT_PLAYER_NAME,
  LANG_KEY,
  MAX_SCORES,
  PLAYER_NAME_KEY,
  SCORE_KEY,
  SKIN_KEY,
} from '../game/constants.js';

export class ScoreStore {
  getPlayerName() {
    try {
      const raw = localStorage.getItem(PLAYER_NAME_KEY);
      if (!raw || typeof raw !== 'string') {
        return DEFAULT_PLAYER_NAME;
      }
      const name = raw.trim();
      return name || DEFAULT_PLAYER_NAME;
    } catch {
      return DEFAULT_PLAYER_NAME;
    }
  }

  setPlayerName(name) {
    const safeName = this.normalizeName(name);
    localStorage.setItem(PLAYER_NAME_KEY, safeName);
    return safeName;
  }

  getScores() {
    try {
      const raw = localStorage.getItem(SCORE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      const normalized = parsed
        .map((entry) => {
          if (Number.isFinite(entry)) {
            return {
              name: DEFAULT_PLAYER_NAME,
              score: Math.max(0, Math.floor(entry)),
            };
          }

          if (entry && typeof entry === 'object' && Number.isFinite(entry.score)) {
            return {
              name: this.normalizeName(entry.name),
              score: Math.max(0, Math.floor(entry.score)),
            };
          }

          return null;
        })
        .filter(Boolean);

      // Keep only the best score per player name
      const best = new Map();
      for (const entry of normalized) {
        const key = entry.name.toLowerCase();
        if (!best.has(key) || best.get(key).score < entry.score) {
          best.set(key, entry);
        }
      }
      return [...best.values()].sort((a, b) => b.score - a.score).slice(0, MAX_SCORES);
    } catch {
      return [];
    }
  }

  saveScore(score, playerName) {
    const safeScore = Math.max(0, Math.floor(score));
    const next = [...this.getScores(), { name: this.normalizeName(playerName), score: safeScore }]
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_SCORES);
    localStorage.setItem(SCORE_KEY, JSON.stringify(next));
    return next;
  }

  getLang() {
    try {
      const raw = localStorage.getItem(LANG_KEY);
      return raw === 'en' ? 'en' : 'ru';
    } catch {
      return 'ru';
    }
  }

  setLang(lang) {
    const safe = lang === 'en' ? 'en' : 'ru';
    localStorage.setItem(LANG_KEY, safe);
    return safe;
  }

  getSkin() {
    try {
      const raw = localStorage.getItem(SKIN_KEY);
      const id = Number(raw);
      return Number.isFinite(id) && id >= 0 && id <= 2 ? id : 0;
    } catch {
      return 0;
    }
  }

  setSkin(id) {
    const safe = Number.isFinite(id) && id >= 0 && id <= 2 ? id : 0;
    localStorage.setItem(SKIN_KEY, String(safe));
    return safe;
  }

  normalizeName(name) {
    if (typeof name !== 'string') {
      return DEFAULT_PLAYER_NAME;
    }
    const cleaned = name.trim().slice(0, 24);
    return cleaned || DEFAULT_PLAYER_NAME;
  }
}
