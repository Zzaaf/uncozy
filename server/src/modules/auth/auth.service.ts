import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(username: string, email: string, password: string) {
    const [existingEmail, existingUsername] = await Promise.all([
      this.users.findByEmail(email),
      this.users.findByUsername(username),
    ]);
    if (existingEmail) throw new ConflictException('Email already registered');
    if (existingUsername) throw new ConflictException('Username already taken');

    const user = await this.users.create(username, email, password);
    return { accessToken: this._sign(user), user };
  }

  async login(username: string, password: string) {
    const record = await this.users.findByUsername(username);
    if (!record) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, record.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const { passwordHash: _ph, id: _id, ...user } = record;
    return { accessToken: this._sign(user), user };
  }

  private _sign(user: { publicId: string; username: string; email: string }) {
    return this.jwt.sign({ sub: user.publicId, username: user.username, email: user.email });
  }
}
