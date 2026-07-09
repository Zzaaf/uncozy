import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const PUBLIC_SELECT = {
  publicId: true,
  username: true,
  email: true,
  gamesPlayed: true,
  highScore: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findByPublicId(publicId: string) {
    return this.prisma.user.findUnique({ where: { publicId }, select: PUBLIC_SELECT });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async submitScore(publicId: string, score: number) {
    const user = await this.prisma.user.findUnique({ where: { publicId } });
    if (!user) return null;
    return this.prisma.user.update({
      where: { publicId },
      data: {
        gamesPlayed: { increment: 1 },
        highScore: score > user.highScore ? score : undefined,
      },
      select: PUBLIC_SELECT,
    });
  }

  async create(username: string, email: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);
    try {
      return await this.prisma.user.create({
        data: { publicId: randomUUID(), username, email, passwordHash },
        select: PUBLIC_SELECT,
      });
    } catch {
      throw new ConflictException('Username or email already taken');
    }
  }
}
