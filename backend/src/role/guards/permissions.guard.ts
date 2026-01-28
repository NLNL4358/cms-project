import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleService } from '../role.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private roleService: RoleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 엔드포인트에 설정된 필요 권한 목록 가져오기
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // 권한이 설정되지 않은 경우 통과
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // 현재 사용자 정보 가져오기 (JwtAuthGuard가 먼저 실행되어야 함)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('사용자 정보를 찾을 수 없습니다');
    }

    // 여러 권한 중 하나라도 있으면 허용 (OR 조건)
    const hasPermission = await this.roleService.hasAnyPermission(
      user.id,
      requiredPermissions,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `이 작업을 수행할 권한이 없습니다. 필요한 권한: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
