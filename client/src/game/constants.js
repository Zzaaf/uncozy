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

export const SCORE_KEY = 'doodle_jump_scores';
export const PLAYER_NAME_KEY = 'doodle_jump_player_name';
export const SKIN_KEY = 'doodle_jump_skin';
export const LANG_KEY = 'doodle_jump_lang';
export const DEFAULT_PLAYER_NAME = 'Player';
export const MAX_SCORES = 10;
