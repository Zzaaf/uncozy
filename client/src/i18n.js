const T = {
  ru: {
    title:            'DOODLE\nJUMP',
    subtitle:         '★ PIXEL EDITION ★',

    menu_start:       'СТАРТ',
    menu_scores:      'РЕКОРДЫ',
    menu_settings:    'НАСТРОЙКИ',
    menu_exit:        'ВЫХОД',
    menu_hint:        '← A/D → мышь или тач · ESC — пауза',
    player_prefix:    '▶',
    player_suffix:    '◀',

    pause_title:      'ПАУЗА',
    pause_resume:     'ПРОДОЛЖИТЬ',
    pause_restart:    'НАЧАТЬ ЗАНОВО',
    pause_hint:       'ESC — продолжить',

    confirm_title:    'ЗАНОВО?',
    confirm_msg:      'Текущий прогресс будет потерян!',
    confirm_yes:      'ДА, НАЧАТЬ',
    confirm_no:       'ОТМЕНА',

    scores_title:     '🏆 РЕКОРДЫ',
    scores_empty:     'Пока нет результатов',

    settings_title:   'НАСТРОЙКИ',
    settings_name:    'ИМЯ ИГРОКА',
    settings_char:    'ПЕРСОНАЖ',
    settings_lang:    'ЯЗЫК',
    settings_save:    'СОХРАНИТЬ',

    gameover_title:   '☠ GAME OVER',
    gameover_score:   'Ваш счёт:',
    gameover_restart: 'ЗАНОВО',
    gameover_scores:  'РЕКОРДЫ',
    gameover_menu:    'МЕНЮ',

    back:             'НАЗАД',
    score_label:      'ОЧКИ',

    skin_0: 'ГЕРОЙ',
    skin_1: 'РОБОТ',
    skin_2: 'МАГ',

    lang_ru: 'РУС',
    lang_en: 'ENG',

    auth_loading:      'ЗАГРУЗКА...',
    auth_login_tab:    'ВХОД',
    auth_reg_tab:      'РЕГИСТРАЦИЯ',
    auth_email:        'EMAIL',
    auth_password:     'ПАРОЛЬ',
    auth_username:     'НИКНЕЙМ',
    auth_login_btn:    'ВОЙТИ',
    auth_reg_btn:      'СОЗДАТЬ',
    auth_logout:       'ВЫЙТИ ИЗ АККАУНТА',
    auth_hint_login:   'Нет аккаунта? Перейди на вкладку РЕГИСТРАЦИЯ',
    auth_hint_reg:     'Уже есть аккаунт? Перейди на вкладку ВХОД',
    auth_username_hint:'3–20 символов: буквы, цифры, _',
    auth_pass_hint:    'Минимум 6 символов',
  },

  en: {
    title:            'DOODLE\nJUMP',
    subtitle:         '★ PIXEL EDITION ★',

    menu_start:       'START',
    menu_scores:      'HIGH SCORES',
    menu_settings:    'SETTINGS',
    menu_exit:        'EXIT',
    menu_hint:        '← A/D → mouse or touch · ESC — pause',
    player_prefix:    '▶',
    player_suffix:    '◀',

    pause_title:      'PAUSED',
    pause_resume:     'CONTINUE',
    pause_restart:    'RESTART',
    pause_hint:       'ESC — continue',

    confirm_title:    'RESTART?',
    confirm_msg:      'Current progress will be lost!',
    confirm_yes:      'YES, RESTART',
    confirm_no:       'CANCEL',

    scores_title:     '🏆 HIGH SCORES',
    scores_empty:     'No scores yet',

    settings_title:   'SETTINGS',
    settings_name:    'PLAYER NAME',
    settings_char:    'CHARACTER',
    settings_lang:    'LANGUAGE',
    settings_save:    'SAVE',

    gameover_title:   '☠ GAME OVER',
    gameover_score:   'Your score:',
    gameover_restart: 'RESTART',
    gameover_scores:  'SCORES',
    gameover_menu:    'MENU',

    back:             'BACK',
    score_label:      'SCORE',

    skin_0: 'HERO',
    skin_1: 'ROBOT',
    skin_2: 'WIZARD',

    lang_ru: 'RUS',
    lang_en: 'ENG',

    auth_loading:      'LOADING...',
    auth_login_tab:    'LOGIN',
    auth_reg_tab:      'REGISTER',
    auth_email:        'EMAIL',
    auth_password:     'PASSWORD',
    auth_username:     'USERNAME',
    auth_login_btn:    'SIGN IN',
    auth_reg_btn:      'CREATE',
    auth_logout:       'LOG OUT',
    auth_hint_login:   'No account? Switch to REGISTER tab',
    auth_hint_reg:     'Have an account? Switch to LOGIN tab',
    auth_username_hint:'3–20 chars: letters, numbers, _',
    auth_pass_hint:    'At least 6 characters',
  },
};

let _lang = 'ru';

export function setLang(lang) {
  _lang = lang === 'en' ? 'en' : 'ru';
}

export function getLang() {
  return _lang;
}

export function t(key) {
  return T[_lang]?.[key] ?? T.ru[key] ?? key;
}
