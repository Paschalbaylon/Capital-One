import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class VerifyPinDto {
  @IsString()
  @IsNotEmpty({ message: 'PIN is required' })
  @Length(4, 6, { message: 'PIN must be 4-6 digits' })
  @Matches(/^\d+$/, { message: 'PIN must contain only numbers' })
  pin: string;
}
