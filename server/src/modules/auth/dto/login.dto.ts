import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username: only letters, numbers, underscores' })
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}
