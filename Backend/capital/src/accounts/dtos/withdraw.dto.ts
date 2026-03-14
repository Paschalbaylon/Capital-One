import {
  IsNumber,
  IsPositive,
  IsNotEmpty,
  Min,
  Max,
  IsString,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger/dist/decorators/api-property.decorator';

export class WithdrawDto {
  @ApiProperty({
    description: 'Amount to withdraw',
    example: 1000,
    minimum: 100,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @Min(100, { message: 'Minimum withdrawal amount is ₱100' })
  amount: number;

  @ApiProperty({
    description: 'Transaction PIN (4-6 digits)',
    example: '1234',
    minLength: 4,
    maxLength: 6,
  })
  @IsString()
  @Length(4, 6, { message: 'PIN must be 4-6 digits' })
  pin: string;

  @ApiProperty({
    description: 'Optional notes for the withdrawal',
    example: 'Cash withdrawal for expenses',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;
}
