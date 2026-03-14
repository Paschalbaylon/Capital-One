import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CloseAccountDto {
  @IsString()
  @IsNotEmpty()
  @Length(4, 6)
  pin: string;
}
