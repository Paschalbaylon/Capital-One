import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class SetPinDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty({ message: 'PIN is required' })
  @Length(4, 6, { message: 'PIN must be 4-6 digits' })
  @Matches(/^\d+$/, { message: 'PIN must contain only numbers' })
  pin: string; // New transaction PIN
}
