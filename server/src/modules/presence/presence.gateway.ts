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

const WS_MSG_LIMIT    = 30;   // max messages per window
const WS_MSG_WINDOW   = 60_000; // 1 minute window

interface AuthedSocket extends WebSocket {
  publicId?: string;
  username?: string;
  isAuthed?: boolean;
  pingTimer?: ReturnType<typeof setInterval>;
  msgCount?: number;
  msgWindowStart?: number;
}

export type WsMsg =
  | { type: 'auth'; token: string }
  | { type: 'ping' }
  | { type: 'chat:global'; text: string }
  | { type: 'chat:dm'; to: string; text: string };

@WebSocketGateway({ path: '/ws' })
export class PresenceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly online = new Map<string, AuthedSocket>();

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleConnection(socket: AuthedSocket, _req: IncomingMessage) {
    socket.isAuthed       = false;
    socket.msgCount       = 0;
    socket.msgWindowStart = Date.now();

    const authTimeout = setTimeout(() => {
      if (!socket.isAuthed) socket.close(4001, 'auth_timeout');
    }, 5000);

    socket.on('message', (raw: Buffer | string) => {
      // ── Rate limit ──────────────────────────────────────────────
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

      // ── Parse ────────────────────────────────────────────────────
      let msg: WsMsg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      // ── Auth handshake ───────────────────────────────────────────
      if (!socket.isAuthed) {
        if (msg.type !== 'auth') return socket.close(4002, 'expected_auth');
        clearTimeout(authTimeout);

        let payload: { sub: string; username: string };
        try {
          payload = this.jwt.verify(msg.token, {
            secret: this.config.getOrThrow<string>('JWT_SECRET'),
          }) as { sub: string; username: string };
        } catch {
          return socket.close(4003, 'invalid_token');
        }

        // Reject game-session tokens trying to auth as presence
        const raw_payload = payload as any;
        if (raw_payload.type === 'game_session') {
          return socket.close(4003, 'invalid_token');
        }

        socket.publicId  = payload.sub;
        socket.username  = payload.username;
        socket.isAuthed  = true;

        this.online.set(payload.sub, socket);

        socket.pingTimer = setInterval(() => {
          if (socket.readyState === socket.OPEN) {
            socket.send(JSON.stringify({ type: 'pong' }));
          }
        }, 25000);

        this.broadcastOnline();
        return;
      }

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
