import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * 엔드포인트에 필요한 권한을 지정하는 데코레이터
 * @param permissions - 필요한 권한 목록 (resource:action 형식)
 *
 * @example
 * // 단일 권한
 * @Permissions('content:create')
 *
 * // 여러 권한 중 하나라도 있으면 허용 (OR)
 * @Permissions('content:update', 'content:delete')
 */
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
