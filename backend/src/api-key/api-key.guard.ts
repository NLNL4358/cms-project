import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiKeyService } from './api-key.service';

/**
 * Public API 인증 가드
 * Authorization: Bearer sk_live_xxxxxx 형식의 API 키를 검증
 * 권한(permissions) 필드 검증 포함
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private apiKeyService: ApiKeyService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('API 키가 필요합니다');
    }

    const rawKey = authHeader.substring(7);

    if (!rawKey.startsWith('sk_live_')) {
      throw new UnauthorizedException('유효하지 않은 API 키 형식입니다');
    }

    const apiKey = await this.apiKeyService.verify(rawKey);
    if (!apiKey) {
      throw new UnauthorizedException('유효하지 않거나 만료된 API 키입니다');
    }

    // 권한 검증: 메서드별로 필요한 권한 결정
    const method = request.method;
    const requiredPermission = method === 'GET' ? 'public:read' : 'public:write';
    const permissions = Array.isArray(apiKey.permissions) ? apiKey.permissions : [];

    if (!permissions.includes('*') && !permissions.includes(requiredPermission)) {
      throw new ForbiddenException(`이 API 키는 "${requiredPermission}" 권한이 없습니다`);
    }

    request.apiKey = apiKey;
    return true;
  }
}
