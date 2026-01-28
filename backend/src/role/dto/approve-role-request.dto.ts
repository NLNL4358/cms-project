import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ApproveRoleRequestDto {
  @ApiProperty({
    example: '승인 메모',
    description: '승인 시 메모 (선택사항)',
    required: false,
  })
  @IsString()
  @IsOptional()
  comment?: string;
}
