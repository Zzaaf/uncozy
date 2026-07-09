const TOKEN_KEY = 'doodle_jump_token';
const USER_KEY  = 'doodle_jump_user';

export const AuthApi = {
  async register(username, email, password) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Registration failed'));
    this._persist(data);
    return data;
  },

  async login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Login failed'));
    this._persist(data);
    return data;
  },

  async me() {
    const token = this.getToken();
    if (!token) return null;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { this.logout(); return null; }
      return (await res.json()).user;
    } catch {
      return null;
    }
  },

  _persist({ accessToken, user }) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getToken() { return localStorage.getItem(TOKEN_KEY); },

  getUser() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isLoggedIn() { return !!this.getToken(); },

  async submitScore(score) {
    const token = this.getToken();
    if (!token) return;
    try {
      await fetch('/api/auth/me/score', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ score: Math.floor(score) }),
      });
    } catch { /* silent — offline or network error */ }
  },
};
