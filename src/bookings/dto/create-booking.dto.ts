import { IsUUID, IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID()
  @IsNotEmpty()
  slotId: string;

  @ApiProperty({ example: 'Alex Morgan' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ example: 'alex@example.com' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;
}
