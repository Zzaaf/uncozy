import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';
import { MAX_SCORE } from '../../game/game.service';

export class SubmitScoreDto {
  @IsInt()
  @Min(0)
  @Max(MAX_SCORE)
  score: number;

  @IsString()
  @MinLength(10)
  sessionToken: string;

  @IsOptional() @IsInt() @Min(0) totalKills?: number;
  @IsOptional() @IsInt() @Min(0) crawlersKilled?: number;
  @IsOptional() @IsInt() @Min(0) flyersKilled?: number;
  @IsOptional() @IsInt() @Min(0) shootersKilled?: number;
  @IsOptional() @IsInt() @Min(0) droppersKilled?: number;
  @IsOptional() @IsInt() @Min(0) barriersDestroyed?: number;
  @IsOptional() @IsInt() @Min(0) maxLevelReached?: number;
}
