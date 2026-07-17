import { Controller, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { GameService } from './game.service';
import { UserThrottlerGuard } from '../../common/guards/user-throttler.guard';
import { CsrfGuard } from '../../common/guards/csrf.guard';

@Controller('api/game')
@UseGuards(AuthGuard('jwt'), CsrfGuard, UserThrottlerGuard)
export class GameController {
  constructor(private readonly game: GameService) {}

  @Post('session')
  @Throttle({ game: { limit: 60, ttl: 3_600_000 } })
  issueSession(@Request() req) {
    return { sessionToken: this.game.issueSessionToken(req.user.publicId) };
  }
}
