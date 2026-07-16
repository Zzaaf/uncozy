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

  async updateUsername(publicId: string, newUsername: string) {
    try {
      return await this.prisma.user.update({
        where: { publicId },
        data: { username: newUsername },
        select: PUBLIC_SELECT,
      });
    } catch {
      throw new ConflictException('Username already taken');
    }
  }

  async getLeaderboard(currentPublicId: string) {
    const top = await this.prisma.user.findMany({
      orderBy: { highScore: 'desc' },
      take: 10,
      select: { publicId: true, username: true, highScore: true },
    });

    const me = await this.prisma.user.findUnique({
      where: { publicId: currentPublicId },
      select: { publicId: true, username: true, highScore: true },
    });

    let myRank: number | null = null;
    if (me) {
      const above = await this.prisma.user.count({
        where: { highScore: { gt: me.highScore } },
      });
      myRank = above + 1;
    }

    const entries = top.map((u, i) => ({
      rank: i + 1,
      publicId: u.publicId,
      username: u.username,
      highScore: u.highScore,
      isMe: u.publicId === currentPublicId,
    }));

    const meInTop = entries.some(e => e.isMe);
    const myEntry =
      me && myRank !== null && !meInTop
        ? { rank: myRank, publicId: me.publicId, username: me.username, highScore: me.highScore }
        : null;

    return { entries, myEntry };
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
