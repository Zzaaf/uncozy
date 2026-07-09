import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async submitScore(userId: string, score: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        gamesPlayed: { increment: 1 },
        highScore: score > user.highScore ? score : undefined,
      },
      select: { id: true, username: true, email: true, gamesPlayed: true, highScore: true },
    });
  }

  async create(username: string, email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    try {
      return await this.prisma.user.create({
        data: { username, email, passwordHash },
        select: { id: true, username: true, email: true, createdAt: true },
      });
    } catch {
      throw new ConflictException('Username or email already taken');
    }
  }
}
