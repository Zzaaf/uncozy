import { Body, Controller, Get, Post, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Post('register')
  @Throttle({ register: { limit: 10, ttl: 3_600_000 } })
  register(@Body(new ValidationPipe({ whitelist: true })) dto: RegisterDto) {
    return this.auth.register(dto.username, dto.email, dto.password);
  }

  @Post('login')
  @Throttle({ auth: { limit: 10, ttl: 900_000 } })
  login(@Body(new ValidationPipe({ whitelist: true })) dto: LoginDto) {
    return this.auth.login(dto.username, dto.password);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ global: {} })
  async me(@Request() req) {
    const user = await this.users.findByPublicId(req.user.publicId);
    return { user };
  }
}
