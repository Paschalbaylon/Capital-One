import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class ResetPinDto {
  @IsString()
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
