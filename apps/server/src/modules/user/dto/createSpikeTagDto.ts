import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CreateSpikeTagDto {
  @ApiProperty({
    description: 'Unique SPIKE tag handle (without leading @)',
    example: 'zaraudo',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 20, { message: 'SPIKE tag must be between 3 and 20 characters' })
  @Matches(/^@?[a-zA-Z0-9._]+$/, {
    message:
      'SPIKE tag can only contain letters, numbers, dots, and underscores',
  })
  tag: string;
}
