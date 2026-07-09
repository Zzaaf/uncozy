import { Body, Controller, Get, Patch, Request, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { SubmitScoreDto } from './dto/submit-score.dto';

@Controller('api/users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@Request() req) {
    return this.users.findByPublicId(req.user.publicId);
  }

  @Patch('me/score')
  submitScore(
    @Request() req,
    @Body(new ValidationPipe({ whitelist: true })) dto: SubmitScoreDto,
  ) {
    return this.users.submitScore(req.user.publicId, dto.score);
  }
}
