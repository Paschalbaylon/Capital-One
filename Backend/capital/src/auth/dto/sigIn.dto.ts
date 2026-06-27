import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class SignInDto {
  @ApiProperty()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @IsEmail({}, { message: 'Invalid email address' })
  readonly email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  @MinLength(4, { message: 'Password must be at least 4 characters long' })
  readonly password!: string;
}
