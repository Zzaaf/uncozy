import { Body, Controller, Get, Post, Patch, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { IsInt, Min } from 'class-validator';

class SubmitScoreDto {
  @IsInt()
  @Min(0)
  score: number;
}
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body(new ValidationPipe({ whitelist: true })) dto: RegisterDto) {
    return this.auth.register(dto.username, dto.email, dto.password);
  }

  @Post('login')
  login(@Body(new ValidationPipe({ whitelist: true })) dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@Request() req) {
    return { user: req.user };
  }

  @Patch('me/score')
  @UseGuards(AuthGuard('jwt'))
  submitScore(
    @Request() req,
    @Body(new ValidationPipe({ whitelist: true })) dto: SubmitScoreDto,
  ) {
    return this.auth.submitScore(req.user.id, dto.score);
  }
}
