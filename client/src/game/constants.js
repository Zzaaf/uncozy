export const WORLD_WIDTH = 14;
export const WORLD_HEIGHT = 24;

export const DOODLER = {
  width: 1.2,
  height: 1.2,
  gravity: -30,
  jumpVelocity: 15.5,
  moveSpeed: 10,
};

export const PLATFORM = {
  width: 2.6,
  height: 0.45,
  horizontalSpread: 5.8,
  verticalMinGap: 1.5,
  verticalMaxGap: 3.1,
  initialCount: 18,
  poolSize: 28,
};

export const CAMERA = {
  followOffset: 7,
  bottomKillMargin: 1.2,
};

export const MAX_LIVES     = 5;
export const INITIAL_LIVES = 3;

export const SUPER_SCORE_THRESHOLD = 2500;
export const HEART_SCORE_THRESHOLD = 5000;
export const SUPER_JUMP_MULTIPLIER = 2.5;

// ── Difficulty levels ─────────────────────────────────────────────────────────
export const LEVEL_THRESHOLDS = [0, 500, 1500, 3000, 5000, 8000, 12000, 17000, 23000, 30000];

// Three.js background colors per level (blue → purple → red progression)
export const LEVEL_BG_COLORS = [
  0x020210, // L1  deep night blue
  0x06021a, // L2  dark indigo
  0x0a0424, // L3  deep purple
  0x0f0220, // L4  royal purple
  0x160118, // L5  dark violet
  0x1a0112, // L6  dark magenta
  0x1e0508, // L7  dark burnt red
  0x1f0200, // L8  deep red
  0x1a0005, // L9  blood red
  0x15001a, // L10 infernal crimson
];

export function getLevelFromScore(score) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (score >= LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export const SCORE_KEY = 'uncozy_scores';
export const PLAYER_NAME_KEY = 'uncozy_player_name';
export const SKIN_KEY = 'uncozy_skin';
export const LANG_KEY = 'uncozy_lang';
export const DEFAULT_PLAYER_NAME = 'Player';
export const MAX_SCORES = 10;
