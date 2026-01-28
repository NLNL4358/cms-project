import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RequestRoleDto {
  @ApiProperty({
    example: 'cm123456789',
    description: '요청할 역할 ID',
  })
  @IsString()
  @IsNotEmpty()
  roleId: string;
}
