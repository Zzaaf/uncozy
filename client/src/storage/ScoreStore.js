import {
  DEFAULT_PLAYER_NAME,
  MAX_SCORES,
  PLAYER_NAME_KEY,
  SCORE_KEY,
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

      return normalized.sort((a, b) => b.score - a.score).slice(0, MAX_SCORES);
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

  normalizeName(name) {
    if (typeof name !== 'string') {
      return DEFAULT_PLAYER_NAME;
    }
    const cleaned = name.trim().slice(0, 24);
    return cleaned || DEFAULT_PLAYER_NAME;
  }
}
