// withdraw.dto.ts
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
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawEditDto {
  @ApiProperty({
    description: 'Amount to withdraw',
    example: 1000,
    minimum: 100,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @Min(100, { message: 'Minimum withdrawal amount is ₱100' })
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Transaction PIN (4-6 digits)',
    example: '1234',
    minLength: 4,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'PIN is required' })
  @Length(4, 6, { message: 'PIN must be 4-6 digits' })
  @Matches(/^\d+$/, { message: 'PIN must contain only numbers' })
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

  @ApiProperty({
    description: 'Custom date of the transaction in ISO format',
    example: '2025-01-01T10:30:00.000Z',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Transaction date must be a valid ISO date string' },
  )
  transactionDate?: string;
}
