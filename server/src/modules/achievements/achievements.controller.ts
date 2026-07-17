import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AchievementsService } from './achievements.service';
import { UserThrottlerGuard } from '../../common/guards/user-throttler.guard';

@Controller('api/achievements')
@UseGuards(AuthGuard('jwt'), UserThrottlerGuard)
export class AchievementsController {
  constructor(private readonly achievements: AchievementsService) {}

  @Get()
  @Throttle({ global: {} })
  async list(@Request() req) {
    const [all, unlocked] = await Promise.all([
      this.achievements.getAll(),
      this.achievements.getUserAchievements(req.user.publicId),
    ]);
    const unlockedMap = new Map(unlocked.map(u => [u.achievementId, u.unlockedAt]));
    return all.map(a => ({
      code: a.code,
      nameRu: a.nameRu,
      nameEn: a.nameEn,
      descRu: a.descRu,
      descEn: a.descEn,
      points: a.points,
      sortOrder: a.sortOrder,
      unlocked: unlockedMap.has(a.id),
      unlockedAt: unlockedMap.get(a.id) ?? null,
    }));
  }
}
