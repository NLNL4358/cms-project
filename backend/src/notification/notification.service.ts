import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private gateway: NotificationGateway,
  ) {}

  /**
   * 알림 생성 (내부에서 호출)
   */
  async create(params: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }) {
    return this.prisma.notification.create({ data: params });
  }

  /**
   * 특정 사용자의 알림 목록 (최신순, 페이지네이션)
   */
  async findByUser(userId: string, query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      data,
      unreadCount,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 안 읽은 알림 수
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * 단건 읽음 처리
   */
  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  /**
   * 전체 읽음 처리
   */
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  /**
   * 알림 삭제
   */
  async remove(id: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: { id, userId },
    });
  }

  /**
   * 모든 관리자에게 알림 발송 (시스템 알림용)
   */
  async notifyAllAdmins(params: {
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
  }) {
    const admins = await this.prisma.user.findMany({
      where: { type: 'ADMIN', isActive: true },
      select: { id: true },
    });

    if (admins.length === 0) return;

    await this.prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        ...params,
      })),
    });
  }

  /**
   * 특정 권한을 가진 사용자에게만 알림 발송 (역할 기반 필터링)
   * permission: 예) "content:read", "media:read"
   */
  async notifyByPermission(
    permission: string,
    params: {
      type: NotificationType;
      title: string;
      message: string;
      link?: string;
    },
  ) {
    // 해당 권한 또는 와일드카드(*)를 가진 역할 조회
    const roles = await this.prisma.role.findMany({
      select: { id: true, permissions: true },
    });

    const resource = permission.split(':')[0]; // "content:read" → "content"
    const matchingRoleIds = roles
      .filter((role) => {
        const perms = Array.isArray(role.permissions) ? role.permissions as string[] : [];
        return perms.includes('*')
          || perms.includes(permission)
          || perms.includes(`${resource}:*`);
      })
      .map((role) => role.id);

    if (matchingRoleIds.length === 0) return;

    // 해당 역할을 가진 활성 사용자 조회
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        roleId: { in: matchingRoleIds },
        status: 'ACTIVE',
      },
      select: { userId: true },
    });

    const userIds = [...new Set(userRoles.map((ur) => ur.userId))];
    if (userIds.length === 0) return;

    await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        ...params,
      })),
    });

    // WebSocket으로 실시간 전송
    this.gateway.sendToUsers(userIds, params);
  }
}
