import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface GameStats {
  totalKills?: number;
  crawlersKilled?: number;
  flyersKilled?: number;
  shootersKilled?: number;
  droppersKilled?: number;
  barriersDestroyed?: number;
  maxLevelReached?: number;
  score?: number;
}

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() {
    return this.prisma.achievement.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async getUserAchievements(publicId: string) {
    const user = await this.prisma.user.findUnique({
      where: { publicId },
      select: { id: true },
    });
    if (!user) return [];

    return this.prisma.userAchievement.findMany({
      where: { userId: user.id },
      include: { achievement: true },
      orderBy: { unlockedAt: 'asc' },
    });
  }

  /** Called after each game. Returns newly unlocked Achievement rows. */
  async checkAndUnlock(publicId: string, stats: GameStats): Promise<{ code: string; nameRu: string; nameEn: string }[]> {
    const user = await this.prisma.user.findUnique({
      where: { publicId },
      include: { achievements: { select: { achievementId: true } } },
    });
    if (!user) return [];

    const all = await this.prisma.achievement.findMany();
    const unlockedIds = new Set(user.achievements.map(a => a.achievementId));
    const toGrant: number[] = [];

    for (const a of all) {
      if (unlockedIds.has(a.id)) continue;
      if (this._meetsCondition(a.code, user, stats)) {
        toGrant.push(a.id);
      }
    }

    if (toGrant.length === 0) return [];

    await this.prisma.userAchievement.createMany({
      data: toGrant.map(achievementId => ({ userId: user.id, achievementId })),
      skipDuplicates: true,
    });

    return all.filter(a => toGrant.includes(a.id)).map(a => ({
      code: a.code,
      nameRu: a.nameRu,
      nameEn: a.nameEn,
    }));
  }

  private _meetsCondition(code: string, user: any, stats: GameStats): boolean {
    switch (code) {
      case 'FIRST_JUMP':
        return user.gamesPlayed >= 1;
      case 'FIRST_BLOOD':
        return user.totalKills >= 1;
      case 'HUNTER':
        return user.totalKills >= 50;
      case 'CRAWLER_SLAYER':
        return user.crawlersKilled >= 25;
      case 'VETERAN':
        return user.gamesPlayed >= 50;
      case 'SURVIVOR':
        return user.maxLevelReached >= 8;
      case 'SNIPER':
        return user.shootersKilled >= 10;
      case 'GHOST_HUNTER':
        return user.droppersKilled >= 10;
      case 'WALL_BREAKER':
        return user.barriersDestroyed >= 25;
      case 'LEGEND':
        return (stats.score ?? 0) >= 25_000;
      default:
        return false;
    }
  }
}
