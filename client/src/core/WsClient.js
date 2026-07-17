const WS_URL = import.meta.env.VITE_WS_URL
  ?? (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';

export class WsClient {
  constructor({ onOnline } = {}) {
    this._onOnline      = onOnline ?? (() => {});
    this._ws            = null;
    this._reconnectTimer = null;
    this._reconnectDelay = 2000;
    this._destroyed     = false;
  }

  connect() {
    this._destroyed = false;
    this._open();
  }

  disconnect() {
    this._destroyed = true;
    clearTimeout(this._reconnectTimer);
    if (this._ws) {
      this._ws.onclose = null;
      this._ws.close();
      this._ws = null;
    }
    this._onOnline([]);
  }

  _open() {
    if (this._destroyed) return;
    // Browser automatically sends cookies (incl. uncozy_access_token) on WS upgrade
    const ws = new WebSocket(WS_URL);
    this._ws = ws;

    ws.onopen = () => {
      this._reconnectDelay = 2000;
    };

    ws.onmessage = (evt) => {
      let msg;
      try { msg = JSON.parse(evt.data); } catch { return; }
      if (msg.type === 'presence:online') this._onOnline(msg.users ?? []);
    };

    ws.onclose = (evt) => {
      this._ws = null;
      if (this._destroyed) return;
      // 4003 = invalid/missing token — don't reconnect endlessly
      if (evt.code === 4003) return;
      this._reconnectTimer = setTimeout(() => {
        this._reconnectDelay = Math.min(this._reconnectDelay * 2, 30_000);
        this._open();
      }, this._reconnectDelay);
    };

    ws.onerror = () => ws.close();
  }
}
