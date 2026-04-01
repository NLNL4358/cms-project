import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditLogService } from './audit-log.service';

/**
 * 감사 로그 자동 기록 인터셉터.
 * POST/PATCH/PUT/DELETE 요청 시 자동으로 로그를 남긴다.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl, ip, headers } = request;

    // GET 요청은 로그 생략
    if (method === 'GET') {
      return next.handle();
    }

    // 중복 방지: 이미 이 요청에서 로그가 기록된 경우 건너뜀
    if (request._auditLogged) {
      return next.handle();
    }
    request._auditLogged = true;

    // URL에서 엔티티/엔티티ID 추출
    const { entity, entityId } = this.parseUrl(originalUrl);
    if (!entity) {
      return next.handle();
    }

    const action = this.methodToAction(method);
    const userId = request.user?.id || null;
    const userAgent = headers['user-agent'] || '';
    // 실제 클라이언트 IP (프록시 뒤에서도 동작)
    const ipAddress = headers['x-forwarded-for']?.split(',')[0]?.trim()
      || headers['x-real-ip']
      || (ip === '::1' ? '127.0.0.1' : ip);

    return next.handle().pipe(
      tap((responseData) => {
        // 비동기로 로그 기록 (응답 지연 방지)
        this.auditLogService
          .log({
            userId,
            action,
            entity,
            entityId: entityId || responseData?.id || 'unknown',
            newData: method !== 'DELETE' ? this.sanitizeBody(request.body) : undefined,
            ipAddress,
            userAgent,
          })
          .catch(() => {
            // 로그 기록 실패 시 요청은 정상 처리
          });
      }),
    );
  }

  /** URL에서 엔티티명/ID 추출 */
  private parseUrl(url: string): { entity: string | null; entityId: string | null } {
    // 로그 제외 경로
    const excludePaths = ['/auth', '/dashboard', '/audit-logs'];
    if (excludePaths.some((p) => url.startsWith(p))) {
      return { entity: null, entityId: null };
    }

    const parts = url.split('?')[0].split('/').filter(Boolean);

    // /webhooks/:id/test 같은 서브액션 경로 제외
    if (parts.length >= 3 && ['test'].includes(parts[2])) {
      return { entity: null, entityId: null };
    }

    if (parts.length >= 1) {
      const entity = parts[0].replace(/s$/, ''); // 복수형 → 단수형
      const entityId = parts.length >= 2 ? parts[1] : null;
      return { entity, entityId };
    }
    return { entity: null, entityId: null };
  }

  /** HTTP method → action 문자열 */
  private methodToAction(method: string): string {
    switch (method) {
      case 'POST':
        return 'CREATE';
      case 'PATCH':
      case 'PUT':
        return 'UPDATE';
      case 'DELETE':
        return 'DELETE';
      default:
        return method;
    }
  }

  /** 민감 정보 제거 */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;
    const sanitized = { ...body };
    const sensitiveKeys = ['password', 'token', 'secret', 'refreshToken'];
    for (const key of sensitiveKeys) {
      if (key in sanitized) {
        sanitized[key] = '***';
      }
    }
    return sanitized;
  }
}
