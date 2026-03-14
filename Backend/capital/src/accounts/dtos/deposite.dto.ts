import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Min } from 'class-validator';

export class DepositDto {
  @ApiProperty({
    description: 'Amount to deposit',
    example: 1000,
    minimum: 1,
    type: Number,
    required: true,
  })
  @IsNumber({}, { message: 'Amount must be a number' })
  @IsPositive({ message: 'Amount must be positive' })
  @Min(1, { message: 'Amount must be at least 1' })
  amount: number;
}
