import { ApiProperty } from '@nestjs/swagger/dist/decorators/api-property.decorator';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class TransferDto {
  @ApiProperty({
    description: 'Recipient account number',
    example: '9876543210',
    minLength: 10,
    maxLength: 10,
  })
  @IsString()
  @Length(10, 10, { message: 'Account number must be 10 digits' })
  toAccountNumber: string;

  @ApiProperty({
    description: 'Amount to transfer',
    example: 1000,
    minimum: 1,
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @Min(1, { message: 'Minimum transfer amount is ₱1' })
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
    description: 'Optional notes for the transfer',
    example: 'Payment for services',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500, { message: 'Notes cannot exceed 500 characters' })
  notes?: string;
}
