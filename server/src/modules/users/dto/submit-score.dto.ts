import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';
import { MAX_SCORE } from '../../game/game.service';

export class SubmitScoreDto {
  @IsInt()
  @Min(0)
  @Max(MAX_SCORE)
  score: number;

  @IsString()
  @MinLength(10)
  sessionToken: string;
}
