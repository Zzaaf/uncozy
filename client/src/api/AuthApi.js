const USER_KEY = 'uncozy_user';

function getCsrfToken() {
  const m = document.cookie.match(/(?:^|;\s*)uncozy_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : '';
}

function csrfHeaders() {
  return { 'X-CSRF-Token': getCsrfToken() };
}

export const AuthApi = {
  async register(username, email, password) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Registration failed'));
    this._persistUser(data.user);
    return data;
  },

  async login(username, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Login failed'));
    this._persistUser(data.user);
    return data;
  },

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: csrfHeaders(),
      });
    } catch { /* silent — cookie still cleared by server */ }
    this._clearUser();
  },

  async me() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) { this._clearUser(); return null; }
      return (await res.json()).user;
    } catch {
      return null;
    }
  },

  async updateUsername(username) {
    const res = await fetch('/api/users/me/username', {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...csrfHeaders(),
      },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Failed to update username'));
    const user = this.getUser();
    if (user) {
      user.username = username;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    return data;
  },

  async getLeaderboard() {
    try {
      const res = await fetch('/api/users/leaderboard', { credentials: 'include' });
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async startGameSession() {
    try {
      const res = await fetch('/api/game/session', {
        method: 'POST',
        credentials: 'include',
        headers: csrfHeaders(),
      });
      if (!res.ok) return null;
      return (await res.json()).sessionToken ?? null;
    } catch {
      return null;
    }
  },

  async submitScore(score, sessionToken) {
    if (!sessionToken) return;
    try {
      await fetch('/api/users/me/score', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeaders(),
        },
        body: JSON.stringify({ score: Math.floor(score), sessionToken }),
      });
    } catch { /* silent */ }
  },

  _persistUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  _clearUser() {
    localStorage.removeItem(USER_KEY);
  },

  getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  },

  isLoggedIn() {
    return !!this.getUser();
  },
};
