import {
  Body, Controller, Get, Post, UseGuards,
  Request, Res, ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { randomUUID } from 'crypto';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Post('register')
  @Throttle({ register: { limit: 10, ttl: 3_600_000 } })
  async register(
    @Body(new ValidationPipe({ whitelist: true })) dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, user } = await this.auth.register(dto.username, dto.email, dto.password);
    this._setCookies(res, accessToken);
    return { user };
  }

  @Post('login')
  @Throttle({ auth: { limit: 10, ttl: 900_000 } })
  async login(
    @Body(new ValidationPipe({ whitelist: true })) dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, user } = await this.auth.login(dto.username, dto.password);
    this._setCookies(res, accessToken);
    return { user };
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this._clearCookies(res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ global: {} })
  async me(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.users.findByPublicId(req.user.publicId);
    // Refresh CSRF cookie if somehow missing (e.g. only auth cookie survived)
    if (!req.cookies?.['uncozy_csrf']) {
      res.cookie('uncozy_csrf', randomUUID(), this._csrfOpts());
    }
    return { user };
  }

  private _setCookies(res: Response, token: string) {
    res.cookie('uncozy_access_token', token, this._authOpts());
    res.cookie('uncozy_csrf', randomUUID(), this._csrfOpts());
  }

  private _clearCookies(res: Response) {
    const base = { path: '/', maxAge: 0 };
    res.clearCookie('uncozy_access_token', base);
    res.clearCookie('uncozy_csrf', base);
  }

  private _authOpts() {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict' as const,
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    };
  }

  private _csrfOpts() {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      httpOnly: false, // must be readable by JS
      secure: isProd,
      sameSite: 'strict' as const,
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    };
  }
}
