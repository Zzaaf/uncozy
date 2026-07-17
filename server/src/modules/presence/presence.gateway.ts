import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { IncomingMessage } from 'http';
import type WebSocket from 'ws';

const WS_MSG_LIMIT  = 30;
const WS_MSG_WINDOW = 60_000;

interface AuthedSocket extends WebSocket {
  publicId?: string;
  username?: string;
  isAuthed?: boolean;
  pingTimer?: ReturnType<typeof setInterval>;
  msgCount?: number;
  msgWindowStart?: number;
}

export type WsMsg =
  | { type: 'ping' }
  | { type: 'chat:global'; text: string }
  | { type: 'chat:dm'; to: string; text: string };

function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    out[key] = decodeURIComponent(val);
  }
  return out;
}

@WebSocketGateway({ path: '/ws' })
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly online = new Map<string, AuthedSocket>();

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(socket: AuthedSocket, req: IncomingMessage) {
    // ── Authenticate from httpOnly cookie on Upgrade request ─────────────
    const cookies = parseCookies(req.headers.cookie ?? '');
    const token   = cookies['uncozy_access_token'];

    if (!token) { socket.close(4003, 'no_token'); return; }

    let payload: { sub: string; username: string; type?: string };
    try {
      payload = this.jwt.verify(token, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      }) as typeof payload;
    } catch {
      socket.close(4003, 'invalid_token');
      return;
    }

    if (payload.type === 'game_session') {
      socket.close(4003, 'invalid_token');
      return;
    }

    socket.publicId      = payload.sub;
    socket.username      = payload.username;
    socket.isAuthed      = true;
    socket.msgCount      = 0;
    socket.msgWindowStart = Date.now();

    this.online.set(payload.sub, socket);

    socket.pingTimer = setInterval(() => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({ type: 'pong' }));
      }
    }, 25_000);

    this.broadcastOnline();

    // ── Rate-limited message handling (ping / future chat) ───────────────
    socket.on('message', (raw: Buffer | string) => {
      const now = Date.now();
      if (now - (socket.msgWindowStart ?? 0) > WS_MSG_WINDOW) {
        socket.msgCount       = 0;
        socket.msgWindowStart = now;
      }
      socket.msgCount = (socket.msgCount ?? 0) + 1;
      if (socket.msgCount > WS_MSG_LIMIT) {
        socket.close(4029, 'rate_limited');
        return;
      }

      let msg: WsMsg;
      try { msg = JSON.parse(raw.toString()); } catch { return; }
      if (msg.type === 'ping') return;
    });
  }

  handleDisconnect(socket: AuthedSocket) {
    if (socket.publicId) this.online.delete(socket.publicId);
    if (socket.pingTimer) clearInterval(socket.pingTimer);
    this.broadcastOnline();
  }

  private broadcastOnline() {
    const users = Array.from(this.online.values())
      .filter((s) => s.readyState === (s as WebSocket).OPEN)
      .map((s) => ({ id: s.publicId!, username: s.username! }));

    const payload = JSON.stringify({ type: 'presence:online', users });
    this.online.forEach((s) => {
      if (s.readyState === (s as WebSocket).OPEN) s.send(payload);
    });
  }
}
