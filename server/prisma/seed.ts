import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACHIEVEMENTS = [
  {
    code: 'FIRST_JUMP',
    nameRu: 'Первый прыжок',
    nameEn: 'First Jump',
    descRu: 'Сыграй первую игру',
    descEn: 'Play your first game',
    points: 5,
    sortOrder: 1,
  },
  {
    code: 'FIRST_BLOOD',
    nameRu: 'Первая кровь',
    nameEn: 'First Blood',
    descRu: 'Уничтожь первого врага',
    descEn: 'Destroy your first enemy',
    points: 5,
    sortOrder: 2,
  },
  {
    code: 'HUNTER',
    nameRu: 'Охотник',
    nameEn: 'Hunter',
    descRu: 'Уничтожь 50 врагов',
    descEn: 'Destroy 50 enemies',
    points: 20,
    sortOrder: 3,
  },
  {
    code: 'CRAWLER_SLAYER',
    nameRu: 'Истребитель ползунов',
    nameEn: 'Crawler Slayer',
    descRu: 'Уничтожь 25 ползунов',
    descEn: 'Destroy 25 crawlers',
    points: 20,
    sortOrder: 4,
  },
  {
    code: 'VETERAN',
    nameRu: 'Ветеран',
    nameEn: 'Veteran',
    descRu: 'Сыграй 50 игр',
    descEn: 'Play 50 games',
    points: 30,
    sortOrder: 5,
  },
  {
    code: 'SURVIVOR',
    nameRu: 'Выживший',
    nameEn: 'Survivor',
    descRu: 'Доберись до 8-го уровня',
    descEn: 'Reach level 8',
    points: 30,
    sortOrder: 6,
  },
  {
    code: 'SNIPER',
    nameRu: 'Снайпер',
    nameEn: 'Sniper',
    descRu: 'Уничтожь 10 стрелков',
    descEn: 'Destroy 10 shooters',
    points: 40,
    sortOrder: 7,
  },
  {
    code: 'GHOST_HUNTER',
    nameRu: 'Охотник за призраками',
    nameEn: 'Ghost Hunter',
    descRu: 'Уничтожь 10 падальщиков',
    descEn: 'Destroy 10 droppers',
    points: 40,
    sortOrder: 8,
  },
  {
    code: 'WALL_BREAKER',
    nameRu: 'Разрушитель',
    nameEn: 'Wall Breaker',
    descRu: 'Уничтожь 25 барьеров',
    descEn: 'Destroy 25 barriers',
    points: 40,
    sortOrder: 9,
  },
  {
    code: 'LEGEND',
    nameRu: 'Легенда',
    nameEn: 'Legend',
    descRu: 'Набери 25 000 очков за одну игру',
    descEn: 'Score 25,000 points in a single game',
    points: 100,
    sortOrder: 10,
  },
];

async function main() {
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { code: a.code },
      update: a,
      create: a,
    });
  }
  console.log('Seeded achievements.');

  // Retroactively grant FIRST_JUMP to users who have already played
  const firstJump = await prisma.achievement.findUnique({ where: { code: 'FIRST_JUMP' } });
  if (!firstJump) return;

  const eligible = await prisma.user.findMany({
    where: { gamesPlayed: { gte: 1 } },
    select: { id: true },
  });

  for (const u of eligible) {
    await prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId: u.id, achievementId: firstJump.id } },
      update: {},
      create: { userId: u.id, achievementId: firstJump.id },
    });
  }
  console.log(`Granted FIRST_JUMP to ${eligible.length} existing users.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
