import { Body, Controller, Get, Patch, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { GameService } from '../game/game.service';
import { SubmitScoreDto } from './dto/submit-score.dto';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { UserThrottlerGuard } from '../../common/guards/user-throttler.guard';

@Controller('api/users')
@UseGuards(AuthGuard('jwt'), UserThrottlerGuard)
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly game: GameService,
  ) {}

  @Get('me')
  @Throttle({ global: {} })
  me(@Request() req) {
    return this.users.findByPublicId(req.user.publicId);
  }

  @Patch('me/username')
  @Throttle({ global: {} })
  updateUsername(
    @Request() req,
    @Body(new ValidationPipe({ whitelist: true })) dto: UpdateUsernameDto,
  ) {
    return this.users.updateUsername(req.user.publicId, dto.username);
  }

  @Get('leaderboard')
  @Throttle({ global: {} })
  leaderboard(@Request() req) {
    return this.users.getLeaderboard(req.user.publicId);
  }

  @Patch('me/score')
  @Throttle({ game: { limit: 60, ttl: 3_600_000 } })
  submitScore(
    @Request() req,
    @Body(new ValidationPipe({ whitelist: true })) dto: SubmitScoreDto,
  ) {
    this.game.consumeSessionToken(dto.sessionToken, req.user.publicId);
    return this.users.submitScore(req.user.publicId, dto.score);
  }
}
