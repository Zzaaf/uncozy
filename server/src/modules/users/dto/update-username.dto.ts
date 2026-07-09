import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdateUsernameDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_Ѐ-ӿ]+$/, { message: 'Username can only contain letters, numbers and _' })
  username: string;
}
