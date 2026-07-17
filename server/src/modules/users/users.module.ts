import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { GameModule } from '../game/game.module';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [GameModule, forwardRef(() => AchievementsModule)],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
