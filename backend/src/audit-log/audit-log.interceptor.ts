import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditLogService } from './audit-log.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '@prisma/client';

/**
 * 감사 로그 자동 기록 인터셉터.
 * POST/PATCH/PUT/DELETE 요청 시 자동으로 로그를 남긴다.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private auditLogService: AuditLogService,
    private notificationService: NotificationService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl, ip, headers } = request;

    // GET 요청은 로그 생략
    if (method === 'GET') {
      return next.handle();
    }

    // 중복 방지: APP_INTERCEPTOR가 모듈별로 인스턴스화되므로 진입 단계에서 차단
    if (request._auditLogged) {
      return next.handle();
    }
    request._auditLogged = true;

    // URL에서 엔티티/엔티티ID 추출
    const { entity, entityId } = this.parseUrl(originalUrl);
    if (!entity) {
      return next.handle();
    }

    const action = this.resolveAction(method, originalUrl);
    const userId = request.user?.id || null;
    const userAgent = headers['user-agent'] || '';
    // 실제 클라이언트 IP (프록시 뒤에서도 동작)
    const ipAddress = headers['x-forwarded-for']?.split(',')[0]?.trim()
      || headers['x-real-ip']
      || (ip === '::1' ? '127.0.0.1' : ip);

    return next.handle().pipe(
      tap((responseData) => {
        // 비동기로 로그 기록 + 알림 생성 (응답 지연 방지)
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
          .catch(() => {});

        // 주요 이벤트에 대해 권한 기반 알림 생성
        this.createNotification(action, entity, responseData)
          .catch(() => {
            // 알림 생성 실패 시 요청은 정상 처리
          });
      }),
    );
  }

  /** URL에서 엔티티명/ID 추출 */
  private parseUrl(url: string): { entity: string | null; entityId: string | null } {
    // 로그 제외 경로
    // 감사 로그 제외 경로
    // - 의미 없는 작업: dashboard, audit-logs(자기 참조), notifications(본인 알림 읽음)
    // - 폭증 위험: public/auth (회원가입 폭주), public 콘텐츠 GET
    // - 보안 감사 필요(로그 기록 대상): auth(로그인), api-keys, backups, public/member
    const excludePaths = [
      '/dashboard',
      '/audit-logs',
      '/notifications',
      '/public/auth',
      '/public/content-types',
      '/public/contents',
    ];
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

  /** HTTP method + URL → action 문자열 */
  private resolveAction(method: string, url: string): string {
    const parts = url.split('?')[0].split('/').filter(Boolean);
    // /contents/:id/publish → PUBLISH
    // /contents/:id/unpublish → UNPUBLISH
    // /contents/:id/versions/:v/restore → RESTORE
    if (parts.length >= 3) {
      const subAction = parts[parts.length - 1].toUpperCase();
      if (['PUBLISH', 'UNPUBLISH', 'ARCHIVE', 'UNARCHIVE', 'RESTORE'].includes(subAction)) {
        return subAction;
      }
    }

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

  /** 주요 이벤트 알림 생성 */
  private async createNotification(action: string, entity: string, data: any) {
    const ACTION_LABELS: Record<string, string> = {
      CREATE: '생성', UPDATE: '수정', DELETE: '삭제',
      PUBLISH: '발행', UNPUBLISH: '미발행', ARCHIVE: '보관', UNARCHIVE: '보관 해제', RESTORE: '복원',
    };
    const ENTITY_LABELS: Record<string, string> = {
      content: '콘텐츠', 'content-type': '콘텐츠 타입',
      media: '파일', user: '사용자', role: '역할',
    };

    // 알림 대상 엔티티만 처리
    const entityLabel = ENTITY_LABELS[entity];
    if (!entityLabel) return;

    const actionLabel = ACTION_LABELS[action] || action;
    const title = data?.title || data?.name || '';
    const message = title
      ? `${entityLabel} "${title}"이(가) ${actionLabel}되었습니다`
      : `${entityLabel}이(가) ${actionLabel}되었습니다`;

    // 엔티티별 조회 권한을 가진 사용자에게만 알림
    const permission = `${entity}:read`;

    await this.notificationService.notifyByPermission(permission, {
      type: NotificationType.SYSTEM,
      title: `${entityLabel} ${actionLabel}`,
      message,
      link: entity === 'content' && data?.id ? `/contents/${data.contentTypeId || ''}` : undefined,
    });
  }
}
