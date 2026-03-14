import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DepositEditDto {
  @ApiProperty({
    description: 'Amount to deposit (must be greater than 0)',
    example: 1000.0,
    minimum: 0.01,
    type: Number,
  })
  @IsNumber({}, { message: 'Amount must be a valid number' })
  @IsPositive({ message: 'Deposit amount must be greater than zero' })
  @Min(0.01, { message: 'Minimum deposit amount is ₱0.01' })
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Custom transaction date in ISO 8601 format',
    example: '2024-01-15T10:30:00.000Z',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Transaction date must be a valid ISO 8601 date string' },
  )
  transactionDate?: string;

  @ApiProperty({
    description: 'Optional notes for the deposit transaction',
    example: 'Monthly salary deposit',
    required: false,
    type: String,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
