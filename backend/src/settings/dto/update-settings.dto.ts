import { IsObject, IsOptional, IsString } from 'class-validator';

/**
 * 시스템 설정 일괄 업데이트 DTO.
 * 키-값 쌍으로 전달하며, 존재하는 키는 업데이트, 새 키는 생성한다.
 */
export class UpdateSettingsDto {
  @IsObject()
  settings: Record<string, any>;
}
