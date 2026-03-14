import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class ChangePinDto {
  @IsString()
  @IsNotEmpty({ message: 'Current PIN is required' })
  @Length(4, 6, { message: 'PIN must be 4-6 digits' })
  @Matches(/^\d+$/, { message: 'PIN must contain only numbers' })
  oldPin: string;

  @IsString()
  @IsNotEmpty({ message: 'New PIN is required' })
  @Length(4, 6, { message: 'PIN must be 4-6 digits' })
  @Matches(/^\d+$/, { message: 'PIN must contain only numbers' })
  newPin: string;
}
