import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateAccountDto {
  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  userId?: number; // Optional: Only admins can specify this
}
