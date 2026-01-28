import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RejectRoleRequestDto {
  @ApiProperty({
    example: '역할 요청이 거절되었습니다. 권한이 부족합니다.',
    description: '거절 사유 (필수)',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
