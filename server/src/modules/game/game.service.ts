import { Injectable, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

// Absolute ceiling: physically impossible to reach in a single session
export const MAX_SCORE = 10_000_000;
// Session lifetime for game tokens (ms)
const SESSION_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class GameService {
  // nonce → expiry timestamp
  private readonly _usedNonces = new Map<string, number>();
  private _cleanupTimer: ReturnType<typeof setInterval>;

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    // Purge expired nonces every 5 minutes
    this._cleanupTimer = setInterval(() => this._cleanup(), 5 * 60 * 1000);
  }

  issueSessionToken(publicId: string): string {
    const nonce = randomUUID();
    return this.jwt.sign(
      { sub: publicId, nonce, type: 'game_session' },
      { secret: this.config.getOrThrow<string>('JWT_SECRET'), expiresIn: '30m' },
    );
  }

  /**
   * Validates a game session token and returns the publicId if valid.
   * Throws BadRequestException on any violation.
   */
  consumeSessionToken(sessionToken: string, currentPublicId: string): void {
    let payload: { sub: string; nonce: string; type: string; iat: number };
    try {
      payload = this.jwt.verify(sessionToken, {
        secret: this.config.getOrThrow<string>('JWT_SECRET'),
      }) as typeof payload;
    } catch {
      throw new BadRequestException('Invalid or expired session token');
    }

    if (payload.type !== 'game_session') {
      throw new BadRequestException('Invalid session token type');
    }

    if (payload.sub !== currentPublicId) {
      throw new BadRequestException('Session token does not belong to this user');
    }

    if (this._usedNonces.has(payload.nonce)) {
      throw new BadRequestException('Session token already used');
    }

    const issuedAt = payload.iat * 1000;
    this._usedNonces.set(payload.nonce, issuedAt + SESSION_TTL_MS);
  }

  private _cleanup() {
    const now = Date.now();
    for (const [nonce, expiry] of this._usedNonces) {
      if (now > expiry) this._usedNonces.delete(nonce);
    }
  }

  onModuleDestroy() {
    clearInterval(this._cleanupTimer);
  }
}
